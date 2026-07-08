import { notFound } from "next/navigation";
import {
  createPlannedPilotVisitAction,
  updatePilotAction,
  updatePlannedPilotVisitAction
} from "@/app/(app)/pilots/actions";
import { PageHeader } from "@/components/page-header";
import { PilotForm } from "@/components/pilots/pilot-form";
import { PlannedVisitForm } from "@/components/pilots/planned-visit-form";
import type {
  Pilot,
  PilotDealerOption,
  PilotDeviceOption,
  PilotFarmerLeadOption,
  PilotInstitutionOption,
  RegionOption,
  UserOption
} from "@/lib/pilots/types";
import type { PlannedPilotVisit } from "@/lib/pilots/types";
import {
  loadPilotFarmerLeadOptions,
  pilotFarmerLeadOptionColumns
} from "@/lib/pilots/farmer-lead-options";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { hasAnyRole } from "@/lib/users/permissions";
import { pilotScope } from "@/lib/users/record-scope";
import { display, formatDate } from "@/lib/pilots/types";
import {
  displayPlannedVisitStatus,
  displayVisitParameter,
  plannedVisitTypeOptions
} from "@/lib/pilots/visit-planning";
import { labelFor } from "@/lib/pilots/options";

type EditPilotPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

const deviceColumns =
  "id, serial_number, device_code, product_model, device_status";
const institutionColumns = "id, institution_code, organization_name";
const dealerColumns = "id, dealer_code, dealer_name, firm_name";

export default async function EditPilotPage({
  params,
  searchParams
}: EditPilotPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/pilots");
  const scope = await pilotScope(supabase, currentUser);
  let pilotQuery = supabase
    .from("pilots")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    pilotQuery = pilotQuery.is("id", null);
  }

  if (scope.orFilter) {
    pilotQuery = pilotQuery.or(scope.orFilter);
  }

  const [
    { data: pilot, error },
    { data: farmerLeads, error: farmerLeadsError },
    { data: devices },
    { data: users },
    { data: regions },
    { data: institutions },
    { data: dealers },
    { data: plannedVisits }
  ] = await Promise.all([
    pilotQuery.single(),
    loadPilotFarmerLeadOptions(supabase, { user: currentUser }),
    supabase
      .from("devices")
      .select(deviceColumns)
      .is("deleted_at", null)
      .order("serial_number", { ascending: true })
      .limit(200),
    supabase
      .from("users")
      .select("id, full_name, role, secondary_role")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("regions")
      .select("id, region_name, state")
      .order("region_name", { ascending: true }),
    supabase
      .from("institutions")
      .select(institutionColumns)
      .is("deleted_at", null)
      .order("organization_name", { ascending: true })
      .limit(200),
    supabase
      .from("dealers")
      .select(dealerColumns)
      .is("deleted_at", null)
      .order("dealer_name", { ascending: true })
      .limit(200),
    supabase
      .from("planned_pilot_visits")
      .select("*")
      .eq("pilot_id", id)
      .is("deleted_at", null)
      .order("visit_number", { ascending: true })
      .order("planned_visit_date", { ascending: true })
  ]);

  if (error || !pilot) {
    notFound();
  }

  if (farmerLeadsError) {
    console.error("[pilots] Farmer Lead option load failed", farmerLeadsError);
  }

  const pilotRow = pilot as Pilot;
  let farmerLeadOptions = (farmerLeads ?? []) as PilotFarmerLeadOption[];
  let deviceOptions = (devices ?? []) as PilotDeviceOption[];
  let institutionOptions = (institutions ?? []) as PilotInstitutionOption[];
  let dealerOptions = (dealers ?? []) as PilotDealerOption[];
  const [
    { data: selectedFarmerLead },
    { data: selectedDevice },
    { data: selectedInstitution },
    { data: selectedDealer }
  ] = await Promise.all([
    pilotRow.farmer_lead_id &&
    !farmerLeadOptions.some((lead) => lead.id === pilotRow.farmer_lead_id)
      ? supabase
          .from("farmer_leads")
          .select(pilotFarmerLeadOptionColumns)
          .eq("id", pilotRow.farmer_lead_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    pilotRow.device_id &&
    !deviceOptions.some((device) => device.id === pilotRow.device_id)
      ? supabase
          .from("devices")
          .select(deviceColumns)
          .eq("id", pilotRow.device_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    pilotRow.institution_id &&
    !institutionOptions.some(
      (institution) => institution.id === pilotRow.institution_id
    )
      ? supabase
          .from("institutions")
          .select(institutionColumns)
          .eq("id", pilotRow.institution_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    pilotRow.dealer_id &&
    !dealerOptions.some((dealer) => dealer.id === pilotRow.dealer_id)
      ? supabase
          .from("dealers")
          .select(dealerColumns)
          .eq("id", pilotRow.dealer_id)
          .maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  if (selectedFarmerLead) {
    farmerLeadOptions = [
      selectedFarmerLead as PilotFarmerLeadOption,
      ...farmerLeadOptions
    ];
  }

  if (selectedDevice) {
    deviceOptions = [selectedDevice as PilotDeviceOption, ...deviceOptions];
  }

  if (selectedInstitution) {
    institutionOptions = [
      selectedInstitution as PilotInstitutionOption,
      ...institutionOptions
    ];
  }

  if (selectedDealer) {
    dealerOptions = [selectedDealer as PilotDealerOption, ...dealerOptions];
  }

  const updateAction = updatePilotAction.bind(null, pilotRow.id);
  const createPlannedVisitAction = createPlannedPilotVisitAction.bind(
    null,
    pilotRow.id
  );
  const plannedVisitsList = (plannedVisits ?? []) as PlannedPilotVisit[];
  const canManageVisitPlans = hasAnyRole(currentUser, [
    "Admin",
    "R&D Head",
    "Agronomist"
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const plannedVisitsByDate = [...plannedVisitsList].sort((first, second) =>
    String(first.planned_visit_date ?? "").localeCompare(
      String(second.planned_visit_date ?? "")
    )
  );
  const nextPlannedVisit = plannedVisitsByDate.find(
    (visit) =>
      !["Completed", "Cancelled", "Unable to Complete"].includes(
        visit.planned_visit_status
      ) && !visit.linked_visit_report_id
  );

  return (
    <section>
      <PageHeader
        eyebrow="R&D and field validation"
        title="Edit Pilot"
        description={pilotRow.pilot_code}
      />
      <PilotForm
        action={updateAction}
        cancelHref={`/pilots/${pilotRow.id}`}
        dealers={dealerOptions}
        devices={deviceOptions}
        error={
          query.error ??
          (farmerLeadsError
            ? "Unable to load farmer leads for pilot editing. Please contact Admin."
            : null)
        }
        farmerLeads={farmerLeadOptions}
        institutions={institutionOptions}
        currentUser={{
          role: currentUser.role,
          secondary_role: currentUser.secondary_role
        }}
        pilot={pilotRow}
        regions={(regions ?? []) as RegionOption[]}
        users={(users ?? []) as UserOption[]}
      />
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Monitoring Plan
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Planned visits for this pilot. Research Assistants complete these
              through My Visits and Visit Reports.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {plannedVisitsList.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm leading-6 text-slate-500">
              No planned visits yet. Add the first planned visit for this pilot.
            </div>
          ) : null}
          {plannedVisitsByDate.length > 0 ? (
            <div className="hidden rounded-md bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[0.9fr_1fr_1.4fr_1.3fr_1fr_1fr_auto] md:items-center md:gap-3">
              <span>Visit</span>
              <span>Planned Date</span>
              <span>Visit Type</span>
              <span>Assigned To</span>
              <span>Crop Stage</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
          ) : null}
          {plannedVisitsByDate.map((visit) => {
            const assignedUser = ((users ?? []) as UserOption[]).find(
              (user) => user.id === visit.assigned_user_id
            );
            const updatePlannedVisitAction = updatePlannedPilotVisitAction.bind(
              null,
              pilotRow.id,
              visit.id
            );

            return (
              <details
                className="group rounded-lg border border-slate-200 bg-white shadow-sm"
                key={visit.id}
              >
                <summary className="grid cursor-pointer list-none gap-3 px-4 py-3 text-sm transition hover:bg-slate-50 md:grid-cols-[0.9fr_1fr_1.4fr_1.3fr_1fr_1fr_auto] md:items-center [&::-webkit-details-marker]:hidden">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:hidden">
                      Visit
                    </p>
                    <p className="font-semibold text-slate-950">
                      Visit {visit.visit_number}
                      {nextPlannedVisit?.id === visit.id ? (
                        <span className="ml-2 rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                          Next Visit
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:hidden">
                      Planned Date
                    </p>
                    <p className="text-slate-700">
                      {formatDate(visit.planned_visit_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:hidden">
                      Visit Type
                    </p>
                    <p className="text-slate-700">
                      {labelFor(visit.visit_type, plannedVisitTypeOptions)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:hidden">
                      Assigned To
                    </p>
                    <p className="text-slate-700">
                      {assignedUser?.full_name ?? display(visit.assigned_user_id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:hidden">
                      Crop Stage
                    </p>
                    <p className="text-slate-700">
                      {display(visit.crop_stage_timing)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:hidden">
                      Status
                    </p>
                    <span className="inline-flex w-fit rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                      {displayPlannedVisitStatus(visit, today)}
                    </span>
                  </div>
                  <span className="font-semibold text-brand-700">
                    <span className="group-open:hidden">Show details</span>
                    <span className="hidden group-open:inline">Hide details</span>
                  </span>
                </summary>
                <div className="border-t border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Parameters to Monitor
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {visit.parameters_to_collect.map((parameter) => (
                          <span
                            className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm"
                            key={parameter}
                          >
                            {displayVisitParameter(parameter)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Linked Report
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {visit.linked_visit_report_id
                          ? "Report submitted"
                          : "No report linked yet."}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Visit Purpose
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {visit.visit_purpose}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Special Instructions
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {display(visit.special_instructions)}
                      </p>
                    </div>
                  </div>
                  {canManageVisitPlans ? (
                    <details className="mt-4 rounded-md border border-slate-200 bg-white">
                      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-brand-700">
                        Edit planned visit
                      </summary>
                      <div className="border-t border-slate-200 p-3">
                        <PlannedVisitForm
                          action={updatePlannedVisitAction}
                          compact
                          submitLabel="Save visit"
                          users={(users ?? []) as UserOption[]}
                          visit={visit}
                        />
                      </div>
                    </details>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
        {canManageVisitPlans ? (
          <details className="mt-4 rounded-md border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-brand-700">
              Add Planned Visit
            </summary>
            <div className="border-t border-slate-200 p-4">
              <PlannedVisitForm
                action={createPlannedVisitAction}
                compact
                defaultAssigneeId={pilotRow.research_assistant_user_id}
                nextVisitNumber={plannedVisitsList.length + 1}
                submitLabel="Add visit"
                users={(users ?? []) as UserOption[]}
              />
            </div>
          </details>
        ) : null}
      </section>
    </section>
  );
}
