import { NextResponse, type NextRequest } from "next/server";
import { appSearchUrl } from "@/lib/integrations/n8n";
import { createServiceClient } from "@/lib/supabase/service";
import { formatDisplayDate } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

const SOURCE_LIMIT = 1000;
const HIGH_PRIORITY_LIMIT = 20;

const closedDispatchStatuses = new Set([
  "Dispatched",
  "Delivered",
  "Installed",
  "Cancelled"
]);

const closedPilotStatuses = new Set([
  "Closed - Successful",
  "Closed - Failed",
  "Closed - Inconclusive",
  "Parked",
  "Cancelled"
]);

const closedMarketingStatuses = new Set(["Delivered", "Cancelled"]);

type HighPriorityItem = {
  category: string;
  severity: "Critical" | "Warning" | "Review";
  title: string;
  status?: string | null;
  dueDate?: string | null;
  nextAction: string;
  url?: string;
};

function localTodayDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Kolkata",
    year: "numeric"
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day
    ? `${year}-${month}-${day}`
    : new Date().toISOString().slice(0, 10);
}

function daysBeforeToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function addHighPriorityItem(
  items: HighPriorityItem[],
  item: HighPriorityItem
) {
  if (items.length < HIGH_PRIORITY_LIMIT) {
    items.push(item);
  }
}

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.N8N_SUMMARY_SECRET;
  const providedSecret = request.headers.get("X-Jiva-N8N-Summary-Secret");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase: ReturnType<typeof createServiceClient>;

  try {
    supabase = createServiceClient();
  } catch {
    return NextResponse.json(
      { error: "Daily summary integration is not configured." },
      { status: 500 }
    );
  }

  const today = localTodayDate();
  const twoDaysAgo = daysBeforeToday(2);
  const sevenDaysAgo = daysBeforeToday(7);
  const highPriorityItems: HighPriorityItem[] = [];

  const { data: paidLeads } = await supabase
    .from("farmer_leads")
    .select(
      "id, lead_code, farmer_name, lead_status, funnel_stage, payment_confirmed_date"
    )
    .eq("payment_confirmed", true)
    .eq("device_dispatched", false)
    .is("linked_dispatch_id", null)
    .is("deleted_at", null)
    .limit(SOURCE_LIMIT);

  const leadIds = new Set(paidLeads?.map((lead) => lead.id) ?? []);
  const { data: openLeadDispatches } = await supabase
    .from("dispatches")
    .select("linked_farmer_lead_id, destination_farmer_lead_id")
    .is("deleted_at", null)
    .neq("dispatch_status", "Cancelled")
    .limit(SOURCE_LIMIT);

  const leadsWithOpenDispatch = new Set(
    (openLeadDispatches ?? [])
      .flatMap((dispatch) => [
        dispatch.linked_farmer_lead_id,
        dispatch.destination_farmer_lead_id
      ])
      .filter((leadId) => leadId && leadIds.has(leadId))
  );
  const paidLeadsReadyForDispatch = (paidLeads ?? []).filter(
    (lead) => !leadsWithOpenDispatch.has(lead.id)
  );

  paidLeadsReadyForDispatch.slice(0, 5).forEach((lead) =>
    addHighPriorityItem(highPriorityItems, {
      category: "Dispatch",
      dueDate: lead.payment_confirmed_date
        ? formatDisplayDate(lead.payment_confirmed_date)
        : null,
      nextAction: "Create a Farmer Sale Dispatch.",
      severity: "Warning",
      status: lead.funnel_stage ?? lead.lead_status,
      title: `${lead.lead_code} · ${lead.farmer_name}`,
      url: appSearchUrl("/farmer-leads", lead.lead_code)
    })
  );

  const { data: pilots } = await supabase
    .from("pilots")
    .select("id, pilot_code, pilot_name, pilot_status, dispatch_id")
    .is("deleted_at", null)
    .limit(SOURCE_LIMIT);
  const pilotDispatchesToCreate = (pilots ?? []).filter(
    (pilot) =>
      !pilot.dispatch_id && !closedPilotStatuses.has(pilot.pilot_status ?? "")
  );
  const pilotSearchById = new Map(
    (pilots ?? []).map((pilot) => [
      pilot.id,
      pilot.pilot_code || pilot.pilot_name
    ])
  );

  pilotDispatchesToCreate.slice(0, 5).forEach((pilot) =>
    addHighPriorityItem(highPriorityItems, {
      category: "Pilots",
      nextAction: "Review whether a Pilot Stock dispatch is needed.",
      severity: "Review",
      status: pilot.pilot_status,
      title: `${pilot.pilot_code} · ${pilot.pilot_name}`,
      url: appSearchUrl("/pilots", pilot.pilot_code)
    })
  );

  const { data: dispatches } = await supabase
    .from("dispatches")
    .select(
      "dispatch_code, dispatch_status, destination_name_snapshot, created_at"
    )
    .is("deleted_at", null)
    .limit(SOURCE_LIMIT);
  const dispatchesNeedingAction = (dispatches ?? []).filter(
    (dispatch) => !closedDispatchStatuses.has(dispatch.dispatch_status ?? "")
  );
  const dispatchesOlderThanTwoDays = dispatchesNeedingAction.filter(
    (dispatch) => dispatch.created_at.slice(0, 10) <= twoDaysAgo
  );
  const dispatchesOlderThanSevenDays = dispatchesNeedingAction.filter(
    (dispatch) => dispatch.created_at.slice(0, 10) <= sevenDaysAgo
  );

  dispatchesOlderThanSevenDays.slice(0, 5).forEach((dispatch) =>
    addHighPriorityItem(highPriorityItems, {
      category: "Dispatch",
      dueDate: formatDisplayDate(dispatch.created_at),
      nextAction: "Review the dispatch status and unblock the handoff.",
      severity: "Critical",
      status: dispatch.dispatch_status,
      title: `${dispatch.dispatch_code} · ${dispatch.destination_name_snapshot}`,
      url: appSearchUrl("/dispatches", dispatch.dispatch_code)
    })
  );

  const { data: plannedVisits } = await supabase
    .from("planned_pilot_visits")
    .select(
      "pilot_id, visit_number, planned_visit_date, planned_visit_status, linked_visit_report_id"
    )
    .is("deleted_at", null)
    .lte("planned_visit_date", today)
    .limit(SOURCE_LIMIT);
  const visitsNeedingReports = (plannedVisits ?? []).filter(
    (visit) =>
      !visit.linked_visit_report_id &&
      !["Completed", "Cancelled"].includes(visit.planned_visit_status ?? "")
  );

  visitsNeedingReports.slice(0, 5).forEach((visit) =>
    addHighPriorityItem(highPriorityItems, {
      category: "Pilots & Visits",
      dueDate: formatDisplayDate(visit.planned_visit_date),
      nextAction: "Submit or follow up on the visit report.",
      severity: visit.planned_visit_date < today ? "Warning" : "Review",
      status: visit.planned_visit_status,
      title: `${pilotSearchById.get(visit.pilot_id) ?? "Pilot"} · Visit ${visit.visit_number}`,
      url: appSearchUrl("/pilots", pilotSearchById.get(visit.pilot_id))
    })
  );

  const { data: reports } = await supabase
    .from("visit_reports")
    .select("report_status")
    .is("deleted_at", null)
    .limit(SOURCE_LIMIT);
  const reportsNeedingReview = (reports ?? []).filter((report) =>
    ["Submitted", "Final Report Submitted", "Awaiting Review"].includes(
      report.report_status ?? ""
    )
  );

  const { data: marketingRequests } = await supabase
    .from("marketing_requests")
    .select(
      "request_code, title, marketing_status, priority, deadline_date, accepted_deadline_date, revised_deadline_date"
    )
    .is("deleted_at", null)
    .limit(SOURCE_LIMIT);
  const openMarketingRequests = (marketingRequests ?? []).filter(
    (requestItem) =>
      !closedMarketingStatuses.has(requestItem.marketing_status ?? "")
  );
  const marketingAwaitingReview = openMarketingRequests.filter((requestItem) =>
    ["Requested", "Needs Clarification"].includes(
      requestItem.marketing_status ?? ""
    )
  );
  const marketingOverdue = openMarketingRequests.filter((requestItem) => {
    const dueDate =
      requestItem.revised_deadline_date ||
      requestItem.accepted_deadline_date ||
      requestItem.deadline_date;
    return dueDate < today;
  });

  marketingOverdue.slice(0, 5).forEach((requestItem) =>
    addHighPriorityItem(highPriorityItems, {
      category: "Marketing",
      dueDate: formatDisplayDate(
        requestItem.revised_deadline_date ||
          requestItem.accepted_deadline_date ||
          requestItem.deadline_date
      ),
      nextAction: "Review the marketing request deadline and delivery status.",
      severity:
        requestItem.priority === "Urgent" || requestItem.priority === "High"
          ? "Critical"
          : "Warning",
      status: requestItem.marketing_status,
      title: `${requestItem.request_code} · ${requestItem.title}`,
      url: appSearchUrl("/marketing-requests", requestItem.request_code)
    })
  );

  const counts = {
    paidLeadsReadyForDispatch: paidLeadsReadyForDispatch.length,
    pilotDispatchesToCreate: pilotDispatchesToCreate.length,
    dispatchesNeedingAction: dispatchesNeedingAction.length,
    dispatchesOlderThanTwoDays: dispatchesOlderThanTwoDays.length,
    dispatchesOlderThanSevenDays: dispatchesOlderThanSevenDays.length,
    visitsNeedingReports: visitsNeedingReports.length,
    visitReportsNeedingReview: reportsNeedingReview.length,
    marketingAwaitingReview: marketingAwaitingReview.length,
    marketingOverdue: marketingOverdue.length,
    systemHealthAlerts: highPriorityItems.length
  };

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summaryDate: formatDisplayDate(today),
    appEnvironment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    sourceLimit: SOURCE_LIMIT,
    highPriorityLimit: HIGH_PRIORITY_LIMIT,
    counts,
    highPriorityItems
  });
}
