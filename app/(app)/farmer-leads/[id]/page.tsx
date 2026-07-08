import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Pencil
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FileLink } from "@/components/uploads/file-link";
import { StatusPill } from "@/components/farmer-leads/status-pill";
import {
  confirmFarmerLeadPaymentAction,
  updateFarmerLeadFollowupAction
} from "@/app/(app)/farmer-leads/actions";
import {
  type FarmerLeadFollowup,
  formatCrop,
  type FarmerLead
} from "@/lib/farmer-leads/types";
import {
  funnelStageOptions,
  labelFor,
  leadSourceOptions
} from "@/lib/farmer-leads/options";
import { createClient } from "@/lib/supabase/server";
import { resolveFileUrl } from "@/lib/uploads/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canConfirmPayment,
  canWriteModule,
  hasAnyRole
} from "@/lib/users/permissions";
import { labelForRole } from "@/lib/users/options";
import { farmerLeadScope } from "@/lib/users/record-scope";

type FarmerLeadDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    followup_error?: string;
    followup_saved?: string;
  }>;
};

type LinkedPilot = {
  id: string;
  pilot_code: string;
  pilot_name: string;
  pilot_type: string;
  pilot_status: string;
  institution_id: string | null;
  dealer_id: string | null;
};

type LinkedDispatch = {
  id: string;
  dispatch_code: string;
  dispatch_status: string;
  dispatch_date: string | null;
  serial_number_snapshot: string;
};

type LinkedInstallation = {
  id: string;
  installation_code: string;
  installation_status: string;
  installation_date: string;
  serial_number_snapshot: string;
};

type LinkedFollowup = {
  id: string;
  followup_code: string;
  followup_status: string;
  followup_due_date: string;
  followup_type: string;
};

function display(value: string | null | undefined) {
  return value || "Not set";
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function isPastDate(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(value);
  date.setHours(0, 0, 0, 0);

  return date < today;
}

function SectionPanel({
  children,
  description,
  title
}: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SummaryCard({
  helper,
  label,
  tone = "neutral",
  value
}: {
  helper?: React.ReactNode;
  label: string;
  tone?: "danger" | "neutral" | "success" | "warning";
  value: React.ReactNode;
}) {
  const toneClassNames = {
    danger: "border-red-200 bg-red-50",
    neutral: "border-slate-200 bg-slate-50",
    success: "border-emerald-200 bg-emerald-50",
    warning: "border-amber-200 bg-amber-50"
  };

  return (
    <div className={`rounded-lg border p-3 ${toneClassNames[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-2 break-words text-lg font-semibold leading-6 text-slate-950">
        {value}
      </div>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function InfoRow({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="break-words text-sm font-semibold leading-6 text-slate-950 sm:max-w-[65%] sm:text-right">
        {value}
      </div>
    </div>
  );
}

function CompactEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
      {children}
    </div>
  );
}

function WorkflowCard({
  children,
  href,
  label,
  value
}: {
  children?: React.ReactNode;
  href?: string;
  label: string;
  value: React.ReactNode;
}) {
  const body = (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-2 break-words text-sm font-semibold leading-6 text-slate-950">
        {value}
      </div>
      {children ? <div className="mt-1 text-xs text-slate-500">{children}</div> : null}
    </div>
  );

  if (!href) {
    return body;
  }

  return (
    <Link className="block hover:opacity-90" href={href}>
      {body}
    </Link>
  );
}

function userLabel(
  user:
    | { full_name: string; email: string; role: string }
    | null
    | undefined,
  fallback: string | null | undefined
) {
  return user
    ? `${user.full_name} · ${labelForRole(user.role)}`
    : display(fallback);
}

function dateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function formFieldClassName() {
  return "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
}

function formTextareaClassName() {
  return `${formFieldClassName()} min-h-24`;
}

function deriveCurrentAction(lead: FarmerLead) {
  const leadStatus = lead.lead_status.toLowerCase();
  const funnelStage = lead.funnel_stage.toLowerCase();

  if (leadStatus === "lost") {
    return {
      helper: "This lead is closed as lost.",
      label: "No action — lost lead",
      tone: "neutral" as const
    };
  }

  if (leadStatus === "parked") {
    return {
      helper: "Review later when the farmer is ready.",
      label: "Parked — review later",
      tone: "warning" as const
    };
  }

  if (funnelStage.includes("pilot active")) {
    return {
      helper: "Pilot workflow is driving the next step.",
      label: "Pilot in progress",
      tone: "warning" as const
    };
  }

  if (funnelStage.includes("pilot completed")) {
    return {
      helper: "Convert pilot outcome into a sales decision.",
      label: "Pilot completed — sales follow-up needed",
      tone: "warning" as const
    };
  }

  if (!lead.payment_confirmed) {
    return {
      helper: "Sales owner should continue conversion follow-up.",
      label: "Follow up for payment / conversion",
      tone: "warning" as const
    };
  }

  if (!lead.device_dispatched) {
    return {
      helper: "Payment is confirmed and dispatch can be prepared.",
      label: "Ready for farmer sale dispatch",
      tone: "success" as const
    };
  }

  if (!lead.installation_completed) {
    return {
      helper: "Device dispatch is done; installation is pending.",
      label: "Awaiting installation",
      tone: "warning" as const
    };
  }

  return {
    helper: "Installation is complete; continue post-installation workflow.",
    label: "Installed / follow-up workflow",
    tone: "success" as const
  };
}

export default async function FarmerLeadDetailPage({
  params,
  searchParams
}: FarmerLeadDetailPageProps) {
  const { id } = await params;
  const { followup_error: followupError, followup_saved: followupSaved } =
    await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/farmer-leads");
  const canWrite = canWriteModule(currentUser, "farmer-leads");
  const scope = await farmerLeadScope(supabase, currentUser);
  let leadQuery = supabase
    .from("farmer_leads")
    .select("*")
    .eq("id", id);

  if (scope.noRecords) {
    leadQuery = leadQuery.is("id", null);
  }

  if (scope.orFilter) {
    leadQuery = leadQuery.or(scope.orFilter);
  }

  const { data, error } = await leadQuery.single();

  if (error || !data) {
    notFound();
  }

  const lead = data as FarmerLead;
  const userIds = Array.from(
    new Set(
      [
        lead.owner_user_id,
        lead.rsm_user_id,
        lead.payment_confirmed_by_user_id
      ].flatMap((userId) => (userId ? [userId] : []))
    )
  );
  const [
    { data: users },
    { data: linkedPilot },
    { data: linkedDispatch },
    { data: linkedInstallation },
    { data: linkedFollowups },
    { data: farmerLeadFollowupRows, count: farmerLeadFollowupCount },
    leadPhotosUrl,
    farmerDocumentUrl
  ] = await Promise.all([
    userIds.length
      ? supabase
          .from("users")
          .select("id, full_name, email, role")
          .in("id", userIds)
      : Promise.resolve({ data: [] }),
    lead.linked_pilot_id
      ? supabase
          .from("pilots")
          .select(
            "id, pilot_code, pilot_name, pilot_type, pilot_status, institution_id, dealer_id"
          )
          .eq("id", lead.linked_pilot_id)
          .is("deleted_at", null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    lead.linked_dispatch_id
      ? supabase
          .from("dispatches")
          .select("id, dispatch_code, dispatch_status, dispatch_date, serial_number_snapshot")
          .eq("id", lead.linked_dispatch_id)
          .is("deleted_at", null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    lead.linked_installation_id
      ? supabase
          .from("installations")
          .select(
            "id, installation_code, installation_status, installation_date, serial_number_snapshot"
          )
          .eq("id", lead.linked_installation_id)
          .is("deleted_at", null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("followups")
      .select("id, followup_code, followup_status, followup_due_date, followup_type")
      .eq("farmer_lead_id", lead.id)
      .is("deleted_at", null)
      .order("followup_due_date", { ascending: false })
      .limit(5),
    supabase
      .from("farmer_lead_followups")
      .select(
        [
          "id",
          "farmer_lead_id",
          "followed_up_by_user_id",
          "followup_date",
          "priority",
          "interaction_note",
          "concern_or_blocker",
          "next_action_date",
          "next_followup_date",
          "remarks",
          "created_at",
          "updated_at",
          "deleted_at"
        ].join(","),
        { count: "exact" }
      )
      .eq("farmer_lead_id", lead.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10),
    resolveFileUrl(supabase, lead.lead_photo_folder_link),
    resolveFileUrl(supabase, lead.farmer_document_link)
  ]);
  const userMap = new Map((users ?? []).map((user) => [user.id, user]));
  const pilot = linkedPilot as LinkedPilot | null;
  const dispatch = linkedDispatch as LinkedDispatch | null;
  const installation = linkedInstallation as LinkedInstallation | null;
  const followups = (linkedFollowups ?? []) as LinkedFollowup[];
  const farmerLeadFollowups =
    ((farmerLeadFollowupRows ?? []) as unknown) as FarmerLeadFollowup[];
  const followupUserIds = Array.from(
    new Set(
      farmerLeadFollowups.flatMap((followup) =>
        followup.followed_up_by_user_id &&
        !userMap.has(followup.followed_up_by_user_id)
          ? [followup.followed_up_by_user_id]
          : []
      )
    )
  );

  if (followupUserIds.length) {
    const { data: followupUsers } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .in("id", followupUserIds);

    for (const user of followupUsers ?? []) {
      userMap.set(user.id, user);
    }
  }

  const institutionId = lead.linked_institution_id ?? pilot?.institution_id ?? null;
  const dealerId = lead.linked_dealer_id ?? pilot?.dealer_id ?? null;
  const [{ data: institution }, { data: dealer }] = await Promise.all([
    institutionId
      ? supabase
          .from("institutions")
          .select("id, organization_name")
          .eq("id", institutionId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    dealerId
      ? supabase
          .from("dealers")
          .select("id, dealer_name, firm_name")
          .eq("id", dealerId)
          .maybeSingle()
      : Promise.resolve({ data: null })
  ]);
  const linkedInstitution = institution as
    | { id: string; organization_name: string }
    | null;
  const linkedDealer = dealer as
    | { id: string; dealer_name: string; firm_name: string | null }
    | null;
  const confirmPaymentAction = confirmFarmerLeadPaymentAction.bind(null, lead.id);
  const canConfirmLeadPayment = canConfirmPayment(currentUser);
  const hasInconsistentDeviceInstalledStage =
    lead.funnel_stage === "Device Installed" && !lead.installation_completed;
  const canSeeWorkflowWarning = hasAnyRole(currentUser, ["Admin", "Management"]);
  const canSeeContextWarning = hasAnyRole(currentUser, ["Admin", "Management"]);
  const currentAction = deriveCurrentAction(lead);
  const nextFollowupDate = lead.followup_due_date ?? lead.next_action_date;
  const followupOverdue = isPastDate(nextFollowupDate);
  const nextActionOverdue = isPastDate(lead.next_action_date);
  const paymentConfirmedBy = lead.payment_confirmed_by_user_id
    ? userMap.get(lead.payment_confirmed_by_user_id)
    : null;
  const saveFollowupAction = updateFarmerLeadFollowupAction.bind(null, lead.id);
  const latestFarmerLeadFollowup = farmerLeadFollowups[0];

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Farmer Lead"
          title={lead.farmer_name}
          description={`${display(lead.lead_code)} · ${display(lead.village)}, ${display(
            lead.district
          )}`}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/farmer-leads"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
          {canWrite ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              href={`/farmer-leads/${lead.id}/edit`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          ) : null}
          {canConfirmLeadPayment && !lead.payment_confirmed ? (
            <form action={confirmPaymentAction}>
              <button
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 sm:w-auto"
                type="submit"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Confirm payment
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {canSeeWorkflowWarning && hasInconsistentDeviceInstalledStage ? (
        <div className="mb-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <p>
            This lead is marked Device Installed in funnel stage, but no
            completed farmer-sale installation is linked.
          </p>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2">
        <StatusPill status={lead.lead_status} />
        <span className="inline-flex min-h-8 items-center rounded-md border border-brand-100 bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
          {labelFor(lead.funnel_stage, funnelStageOptions)}
        </span>
      </div>

      <div className="mt-6">
        <SectionPanel
          title="Lead progress / action summary"
          description="Current funnel state, next action, and accountability."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard label="Lead status" value={lead.lead_status} />
            <SummaryCard
              label="Funnel stage"
              value={labelFor(lead.funnel_stage, funnelStageOptions)}
            />
            <SummaryCard
              helper={currentAction.helper}
              label="Current action needed"
              tone={currentAction.tone}
              value={currentAction.label}
            />
            <SummaryCard
              helper={followupOverdue ? "Overdue" : "Scheduled follow-up"}
              label="Next follow-up"
              tone={followupOverdue ? "danger" : "neutral"}
              value={formatDate(nextFollowupDate)}
            />
            <SummaryCard
              label="Lead owner"
              value={userLabel(userMap.get(lead.owner_user_id), lead.owner_user_id)}
            />
            <SummaryCard
              label="RSM"
              value={userLabel(userMap.get(lead.rsm_user_id), lead.rsm_user_id)}
            />
          </div>
        </SectionPanel>
      </div>

      <div className="mt-6">
        <SectionPanel
          title="Follow-up and next action"
          description="Update the current sales follow-up without changing payment, dispatch, or installation workflow fields."
        >
          {followupSaved ? (
            <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              Follow-up saved.
            </div>
          ) : null}
          {followupError ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {followupError}
            </div>
          ) : null}

          {canWrite ? (
            <form action={saveFollowupAction}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Follow-up priority
                  </span>
                  <select
                    className={formFieldClassName()}
                    defaultValue={lead.followup_priority}
                    name="followup_priority"
                  >
                    {["High", "Medium", "Low"].map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Last interaction date
                  </span>
                  <input
                    className={formFieldClassName()}
                    defaultValue={dateInputValue(lead.last_interaction_date)}
                    name="last_interaction_date"
                    type="date"
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Next follow-up date
                  </span>
                  <input
                    className={formFieldClassName()}
                    defaultValue={dateInputValue(lead.followup_due_date)}
                    name="followup_due_date"
                    type="date"
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Lead next action date
                  </span>
                  <input
                    className={formFieldClassName()}
                    defaultValue={dateInputValue(lead.next_action_date)}
                    name="next_action_date"
                    required
                    type="date"
                  />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Current concern / blocker
                  </span>
                  <input
                    className={formFieldClassName()}
                    defaultValue={lead.last_interaction_note ?? ""}
                    name="last_interaction_note"
                  />
                </label>
                <label className="md:col-span-2 xl:col-span-3">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Lead remarks / notes
                  </span>
                  <textarea
                    className={formTextareaClassName()}
                    defaultValue={lead.remarks ?? ""}
                    name="remarks"
                  />
                </label>
              </div>
              <button
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                type="submit"
              >
                Save follow-up
              </button>
            </form>
          ) : (
            <div className="divide-y divide-slate-100">
              <InfoRow
                label="Next follow-up date"
                value={
                  <span className={followupOverdue ? "text-red-700" : undefined}>
                    {formatDate(nextFollowupDate)}
                  </span>
                }
              />
              <InfoRow
                label="Lead next action date"
                value={
                  <span className={nextActionOverdue ? "text-red-700" : undefined}>
                    {formatDate(lead.next_action_date)}
                  </span>
                }
              />
              <InfoRow
                label="Last interaction"
                value={`${formatDate(lead.last_interaction_date)} · ${display(
                  lead.last_interaction_note
                )}`}
              />
              <InfoRow
                label="Follow-up priority"
                value={display(lead.followup_priority)}
              />
              <InfoRow
                label="Lead remarks / notes"
                value={display(lead.remarks)}
              />
              <InfoRow
                label="Accountability"
                value={`Owner: ${userLabel(
                  userMap.get(lead.owner_user_id),
                  lead.owner_user_id
                )} · RSM: ${userLabel(
                  userMap.get(lead.rsm_user_id),
                  lead.rsm_user_id
                )}`}
              />
            </div>
          )}
        </SectionPanel>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <details>
          <summary className="flex cursor-pointer list-none flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Past follow-ups
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {farmerLeadFollowupCount ?? farmerLeadFollowups.length} past
                follow-ups
                {latestFarmerLeadFollowup
                  ? ` · Latest ${formatDate(
                      latestFarmerLeadFollowup.followup_date
                    )} by ${userLabel(
                      latestFarmerLeadFollowup.followed_up_by_user_id
                        ? userMap.get(
                            latestFarmerLeadFollowup.followed_up_by_user_id
                          )
                        : null,
                      latestFarmerLeadFollowup.followed_up_by_user_id
                    )}`
                  : ""}
              </p>
            </div>
            <span className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm">
              Show past follow-ups
            </span>
          </summary>
          <div className="border-t border-slate-200 px-4 py-4">
            {farmerLeadFollowups.length ? (
              <div className="space-y-3">
                {farmerLeadFollowups.map((followup) => {
                  const reviewer = followup.followed_up_by_user_id
                    ? userMap.get(followup.followed_up_by_user_id)
                    : null;

                  return (
                    <article
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      key={followup.id}
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {formatDate(followup.followup_date)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Followed up by{" "}
                            {userLabel(reviewer, followup.followed_up_by_user_id)}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400">
                          Saved {formatDate(followup.created_at)}
                        </p>
                      </div>
                      <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Priority
                          </dt>
                          <dd className="mt-1 font-medium text-slate-700">
                            {display(followup.priority)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Next action date
                          </dt>
                          <dd className="mt-1 font-medium text-slate-700">
                            {formatDate(followup.next_action_date)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Next follow-up date
                          </dt>
                          <dd className="mt-1 font-medium text-slate-700">
                            {formatDate(followup.next_followup_date)}
                          </dd>
                        </div>
                        <div className="md:col-span-2">
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Concern / interaction note
                          </dt>
                          <dd className="mt-1 font-medium text-slate-700">
                            {display(
                              followup.concern_or_blocker ??
                                followup.interaction_note
                            )}
                          </dd>
                        </div>
                        <div className="md:col-span-2 xl:col-span-3">
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Remarks / notes
                          </dt>
                          <dd className="mt-1 whitespace-pre-wrap font-medium text-slate-700">
                            {display(followup.remarks)}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  );
                })}
                {(farmerLeadFollowupCount ?? 0) > farmerLeadFollowups.length ? (
                  <p className="text-sm text-slate-500">
                    Showing latest {farmerLeadFollowups.length} follow-ups.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No past follow-ups yet. History begins when a permitted user
                saves a Farmer Lead follow-up.
              </p>
            )}
          </div>
        </details>
      </div>

      <div className="mt-6">
        <SectionPanel
          title="Linked workflow context"
          description="Connected workflows that explain why this lead is in its current state."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pilot ? (
              <WorkflowCard
                href={`/pilots/${pilot.id}`}
                label="Linked pilot"
                value={`${pilot.pilot_code} · ${pilot.pilot_name}`}
              >
                {pilot.pilot_type} · {pilot.pilot_status}
              </WorkflowCard>
            ) : null}
            {linkedInstitution ? (
              <WorkflowCard
                href={`/institutional-partners/${linkedInstitution.id}`}
                label="Through institution"
                value={linkedInstitution.organization_name}
              />
            ) : null}
            {linkedDealer ? (
              <WorkflowCard
                href={`/dealers/${linkedDealer.id}`}
                label="Through dealer"
                value={linkedDealer.firm_name ?? linkedDealer.dealer_name}
              >
                Contact: {linkedDealer.dealer_name}
              </WorkflowCard>
            ) : null}
            {dispatch ? (
              <WorkflowCard
                href={`/dispatches/${dispatch.id}`}
                label="Linked dispatch"
                value={`${dispatch.dispatch_code} · ${dispatch.dispatch_status}`}
              >
                {dispatch.serial_number_snapshot}
              </WorkflowCard>
            ) : null}
            {installation ? (
              <WorkflowCard
                href={`/installations/${installation.id}`}
                label="Linked installation"
                value={`${installation.installation_code} · ${installation.installation_status}`}
              >
                {installation.serial_number_snapshot}
              </WorkflowCard>
            ) : null}
            {canSeeContextWarning &&
            pilot?.pilot_type === "Institution Pilot" &&
            !linkedInstitution ? (
              <WorkflowCard
                label="Pilot data warning"
                value="Institution Pilot is missing institution."
              />
            ) : null}
            {canSeeContextWarning && pilot?.pilot_type === "Dealer Pilot" && !linkedDealer ? (
              <WorkflowCard
                label="Pilot data warning"
                value="Dealer Pilot is missing dealer."
              />
            ) : null}
          </div>
          {!pilot && !linkedInstitution && !linkedDealer && !dispatch && !installation ? (
            <div className="mt-3">
              <CompactEmpty>No linked pilot, dealer, institution, dispatch, or installation yet.</CompactEmpty>
            </div>
          ) : null}
        </SectionPanel>
      </div>

      <div className="mt-6">
        <SectionPanel
          title="Farmer and farm profile"
          description="Stable farmer, location, crop, and farm context."
        >
          <div className="divide-y divide-slate-100">
            <InfoRow label="Mobile number" value={display(lead.mobile_number)} />
            <InfoRow
              label="Alternate mobile number"
              value={display(lead.alternate_mobile_number)}
            />
            <InfoRow
              label="Location"
              value={`${display(lead.village)}, ${display(lead.district)}, ${display(
                lead.state
              )}`}
            />
            <InfoRow label="Taluk" value={display(lead.taluk)} />
            <InfoRow label="Primary crop" value={formatCrop(lead)} />
            <InfoRow label="Crop stage" value={display(lead.crop_stage)} />
            <InfoRow
              label="Crop area"
              value={
                lead.crop_area_acres === null
                  ? "Not set"
                  : `${lead.crop_area_acres} acres`
              }
            />
            <InfoRow
              label="Land size"
              value={
                lead.land_size_acres === null
                  ? "Not set"
                  : `${lead.land_size_acres} acres`
              }
            />
            <InfoRow
              label="Lead source"
              value={labelFor(lead.lead_source, leadSourceOptions)}
            />
          </div>
        </SectionPanel>
      </div>

      <div className="mt-6">
        <SectionPanel
          title="Sales, payment, dispatch, and installation status"
          description="Workflow status from payment, dispatch, and installation records."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Sale outcome" value={lead.lead_status} />
            <SummaryCard
              helper={
                lead.payment_confirmed
                  ? `${formatDate(lead.payment_confirmed_date)} · ${userLabel(
                      paymentConfirmedBy,
                      lead.payment_confirmed_by_user_id
                    )}`
                  : "Payment is still pending."
              }
              label="Payment"
              tone={lead.payment_confirmed ? "success" : "warning"}
              value={lead.payment_confirmed ? "Confirmed" : "Pending"}
            />
            <SummaryCard
              helper={
                dispatch
                  ? `${dispatch.dispatch_code} · ${dispatch.dispatch_status}`
                  : "No linked dispatch yet."
              }
              label="Dispatch"
              tone={lead.device_dispatched ? "success" : "warning"}
              value={lead.device_dispatched ? "Dispatched" : "Pending"}
            />
            <SummaryCard
              helper={
                installation
                  ? `${installation.installation_code} · ${installation.installation_status}`
                  : "No completed farmer-sale installation linked."
              }
              label="Installation"
              tone={lead.installation_completed ? "success" : "warning"}
              value={lead.installation_completed ? "Installed" : "Pending"}
            />
          </div>
        </SectionPanel>
      </div>

      <div className="mt-6">
        <SectionPanel
          title="Documents and photos"
          description="Optional farmer evidence and supporting documents."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <WorkflowCard label="Field / crop photos" value="Lead photos">
              <FileLink href={leadPhotosUrl} label="View lead photos" />
            </WorkflowCard>
            <WorkflowCard label="Supporting farmer document" value="Farmer document">
              <FileLink href={farmerDocumentUrl} label="View farmer document" />
            </WorkflowCard>
          </div>
        </SectionPanel>
      </div>

      <div className="mt-6">
        <SectionPanel
          title="Related records"
          description="Recent records connected to this farmer lead."
        >
          <div className="space-y-3">
            {followups.length ? (
              <>
                <div className="grid gap-3 md:hidden">
                  {followups.map((followup) => (
                    <article
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      key={followup.id}
                    >
                      <Link
                        className="font-semibold text-brand-700 hover:text-brand-800"
                        href={`/follow-ups/${followup.id}`}
                      >
                        {followup.followup_code}
                      </Link>
                      <dl className="mt-3 grid gap-3 text-sm">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Type
                          </dt>
                          <dd className="mt-1 text-slate-700">
                            {followup.followup_type}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </dt>
                          <dd className="mt-1 text-slate-700">
                            {followup.followup_status}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Due date
                          </dt>
                          <dd className="mt-1 text-slate-700">
                            {formatDate(followup.followup_due_date)}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[42rem] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Follow-up</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Due date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {followups.map((followup) => (
                        <tr key={followup.id}>
                          <td className="px-3 py-2">
                            <Link
                              className="font-semibold text-brand-700 hover:text-brand-800"
                              href={`/follow-ups/${followup.id}`}
                            >
                              {followup.followup_code}
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {followup.followup_type}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {followup.followup_status}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {formatDate(followup.followup_due_date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <CompactEmpty>No follow-up records linked yet.</CompactEmpty>
            )}
          </div>
        </SectionPanel>
      </div>
    </section>
  );
}
