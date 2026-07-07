import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { DealerStatusPill } from "@/components/dealers/dealer-status-pill";
import { PageHeader } from "@/components/page-header";
import { FileLink } from "@/components/uploads/file-link";
import { productModelOptions } from "@/lib/devices/options";
import {
  commercialTermsSharedOptions,
  creditTermsOptions,
  dealerAgreementStatusOptions,
  dealerTypeOptions,
  existingCustomerBaseTypeOptions,
  labelFor,
  priorityOptions,
  trainingStatusOptions
} from "@/lib/dealers/options";
import {
  display,
  formatCrops,
  formatDate,
  type Dealer,
  type Device,
  type Dispatch,
  type FarmerLead,
  type Installation,
  type RegionOption,
  type UserOption
} from "@/lib/dealers/types";
import {
  countDealerSales,
  countIssueReportedInstallations,
  currentFinancialYearRange,
  currentMonthRange,
  currentQuarterRange,
  isOverdueDate,
  targetGap,
  type DealerPerformanceInstallation
} from "@/lib/dealers/performance";
import { createClient } from "@/lib/supabase/server";
import { resolveFileUrl } from "@/lib/uploads/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import { canWriteModule } from "@/lib/users/permissions";
import { dealerScope } from "@/lib/users/record-scope";

type DealerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type RelatedPilot = {
  id: string;
  pilot_code: string;
  pilot_name: string;
  pilot_type: string;
  pilot_status: string;
  farmer_name_snapshot: string;
};

function DetailItem({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-2 break-words text-sm font-semibold leading-6 text-slate-950">
        {value}
      </div>
    </div>
  );
}

function numberDisplay(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("en-IN");
}

export default async function DealerDetailPage({
  params
}: DealerDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dealers");
  const canWrite = canWriteModule(currentUser, "dealers");
  const scope = await dealerScope(supabase, currentUser);
  let dealerQuery = supabase
    .from("dealers")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    dealerQuery = dealerQuery.is("id", null);
  }

  if (scope.orFilter) {
    dealerQuery = dealerQuery.or(scope.orFilter);
  }

  const { data, error } = await dealerQuery.single();

  if (error || !data) {
    notFound();
  }

  const dealer = data as Dealer;
  const [agreementUrl, documentsUrl, trainingUrl] = await Promise.all([
    resolveFileUrl(supabase, dealer.agreement_link),
    resolveFileUrl(supabase, dealer.dealer_documents_folder_link),
    resolveFileUrl(supabase, dealer.training_material_shared_link)
  ]);
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartDate = monthStart.toISOString().slice(0, 10);

  const [
    { data: users },
    { data: regions },
    { data: devices },
    { data: dispatchesThisMonth },
    { data: farmerLeads },
    { data: installations },
    { data: relatedPilots }
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, role, secondary_role")
      .in("id", [dealer.dealer_owner_user_id, dealer.rsm_user_id]),
    supabase
      .from("regions")
      .select("id, region_name")
      .eq("id", dealer.region_id)
      .limit(1),
    supabase
      .from("devices")
      .select(
        "id, serial_number, device_code, product_model, dispatch_date, linked_dispatch_id"
      )
      .eq("current_holder_type", "Dealer")
      .eq("current_holder_id", dealer.id)
      .is("deleted_at", null)
      .order("serial_number", { ascending: true }),
    supabase
      .from("dispatches")
      .select(
        "id, dispatch_code, dispatch_date, dispatch_status, serial_number_snapshot, linked_installation_id"
      )
      .eq("destination_type", "Dealer")
      .eq("destination_dealer_id", dealer.id)
      .gte("dispatch_date", monthStartDate)
      .is("deleted_at", null)
      .order("dispatch_date", { ascending: false }),
    supabase
      .from("farmer_leads")
      .select(
        "id, lead_code, farmer_name, mobile_number, village, district, funnel_stage, lead_status"
      )
      .eq("linked_dealer_id", dealer.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("installations")
      .select(
        "id, installation_code, installation_date, farmer_name_snapshot, serial_number_snapshot, product_model, installation_status, installation_type, dealer_id"
      )
      .eq("dealer_id", dealer.id)
      .is("deleted_at", null)
      .order("installation_date", { ascending: false })
      .limit(100),
    supabase
      .from("pilots")
      .select(
        "id, pilot_code, pilot_name, pilot_type, pilot_status, farmer_name_snapshot"
      )
      .eq("dealer_id", dealer.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100)
  ]);

  const userMap = new Map(((users ?? []) as UserOption[]).map((user) => [
    user.id,
    user
  ]));
  const dealerOwner = userMap.get(dealer.dealer_owner_user_id);
  const rsm = userMap.get(dealer.rsm_user_id);
  const region = ((regions ?? []) as RegionOption[])[0];
  const dealerDevices = (devices ?? []) as Pick<
    Device,
    | "id"
    | "serial_number"
    | "device_code"
    | "product_model"
    | "dispatch_date"
    | "linked_dispatch_id"
  >[];
  const dealerDispatches = (dispatchesThisMonth ?? []) as Pick<
    Dispatch,
    | "id"
    | "dispatch_code"
    | "dispatch_date"
    | "dispatch_status"
    | "serial_number_snapshot"
    | "linked_installation_id"
  >[];
  const linkedLeads = (farmerLeads ?? []) as Pick<
    FarmerLead,
    | "id"
    | "lead_code"
    | "farmer_name"
    | "mobile_number"
    | "village"
    | "district"
    | "funnel_stage"
    | "lead_status"
  >[];
  const dealerInstallations = (installations ?? []) as Pick<
    Installation,
    | "id"
    | "installation_code"
    | "installation_date"
    | "farmer_name_snapshot"
    | "serial_number_snapshot"
    | "product_model"
    | "installation_status"
    | "installation_type"
    | "dealer_id"
  >[];
  const relatedPilotsList = (relatedPilots ?? []) as RelatedPilot[];
  const performanceInstallations =
    dealerInstallations as DealerPerformanceInstallation[];
  const monthRange = currentMonthRange();
  const quarterRange = currentQuarterRange();
  const fyRange = currentFinancialYearRange();
  const currentMonthActualSales = countDealerSales(
    performanceInstallations,
    monthRange
  );
  const quarterActualSales = countDealerSales(performanceInstallations, quarterRange);
  const fyActualSales = countDealerSales(performanceInstallations, fyRange);
  const issueReportedInstallations =
    countIssueReportedInstallations(performanceInstallations);
  const openLinkedLeadCount = linkedLeads.filter(
    (lead) => lead.lead_status === "Open"
  ).length;
  const pendingInstallationDispatchCount = dealerDispatches.filter(
    (dispatch) => !dispatch.linked_installation_id
  ).length;
  const nextReviewDate =
    dealer.next_dealer_review_date ?? dealer.next_action_date;
  const firstFarmerInstallationDone =
    fyActualSales > 0 || Boolean(dealer.last_farmer_installation_date);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Dealer"
          title={dealer.dealer_name}
          description={`${dealer.dealer_code} · ${display(dealer.firm_name)}`}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/dealers"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
          {canWrite ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              href={`/dealers/${dealer.id}/edit`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mb-5">
        <DealerStatusPill status={dealer.dealer_status} />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-slate-950">
          Dealer performance
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem
            label="Monthly dealer sales target"
            value={numberDisplay(dealer.monthly_installation_target)}
          />
          <DetailItem
            label="Current month actual dealer sales"
            value={numberDisplay(currentMonthActualSales)}
          />
          <DetailItem
            label="Monthly gap"
            value={numberDisplay(
              targetGap(dealer.monthly_installation_target, currentMonthActualSales)
            )}
          />
          <DetailItem
            label="Quarterly dealer sales target"
            value={numberDisplay(dealer.quarterly_installation_target)}
          />
          <DetailItem
            label="Quarter actual dealer sales"
            value={numberDisplay(quarterActualSales)}
          />
          <DetailItem
            label="Annual dealer sales target"
            value={numberDisplay(dealer.annual_installation_target)}
          />
          <DetailItem
            label="FY actual dealer sales"
            value={numberDisplay(fyActualSales)}
          />
          <DetailItem
            label="Dealer stock available"
            value={numberDisplay(dealerDevices.length)}
          />
          <DetailItem
            label="Open linked farmer leads"
            value={numberDisplay(openLinkedLeadCount)}
          />
          <DetailItem
            label="Dispatches pending installation"
            value={numberDisplay(pendingInstallationDispatchCount)}
          />
          <DetailItem
            label="Issue reported installations"
            value={numberDisplay(issueReportedInstallations)}
          />
          <DetailItem
            label="Next dealer review date"
            value={
              <span
                className={
                  isOverdueDate(nextReviewDate)
                    ? "text-red-700"
                    : "text-slate-950"
                }
              >
                {formatDate(nextReviewDate)}
              </span>
            }
          />
          <DetailItem
            label="Priority"
            value={labelFor(dealer.priority, priorityOptions)}
          />
          <DetailItem
            label="Concern / blocker"
            value={display(dealer.support_required)}
          />
          <DetailItem
            label="Next action date"
            value={formatDate(dealer.next_action_date)}
          />
          <DetailItem
            label="Last dealer review date"
            value={formatDate(dealer.last_dealer_review_date)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Dealer name" value={dealer.dealer_name} />
        <DetailItem label="Firm name" value={display(dealer.firm_name)} />
        <DetailItem label="Contact number" value={dealer.contact_number} />
        <DetailItem
          label="Dealer type"
          value={labelFor(dealer.dealer_type, dealerTypeOptions)}
        />
        <DetailItem
          label="Dealer owner"
          value={
            dealerOwner
              ? `${dealerOwner.full_name} · ${labelForRole(dealerOwner.role)}`
              : dealer.dealer_owner_user_id
          }
        />
        <DetailItem
          label="RSM"
          value={rsm ? `${rsm.full_name} · ${labelForRole(rsm.role)}` : dealer.rsm_user_id}
        />
        <DetailItem
          label="Region"
          value={region?.region_name ?? dealer.region_id}
        />
        <DetailItem
          label="Territory"
          value={`${dealer.taluk_or_territory}, ${dealer.district}, ${dealer.state}`}
        />
        <DetailItem label="Key crops" value={formatCrops(dealer.key_crops)} />
        <DetailItem
          label="Other key crops"
          value={display(dealer.other_key_crops)}
        />
        <DetailItem
          label="Existing customer base"
          value={labelFor(
            dealer.existing_customer_base_type,
            existingCustomerBaseTypeOptions
          )}
        />
        <DetailItem
          label="Priority"
          value={labelFor(dealer.priority, priorityOptions)}
        />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-slate-950">
          Onboarding and commercial details
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem
            label="Training status"
            value={labelFor(dealer.training_status, trainingStatusOptions)}
          />
          <DetailItem
            label="Agreement status"
            value={labelFor(
              dealer.dealer_agreement_status,
              dealerAgreementStatusOptions
            )}
          />
          <DetailItem
            label="Dealer Agreement legal approval"
            value={display(dealer.dealer_agreement_approval_status)}
          />
          <DetailItem
            label="Dealer agreement file"
            value={<FileLink href={agreementUrl} label="View agreement" />}
          />
          <DetailItem
            label="Dealer documents"
            value={<FileLink href={documentsUrl} label="View documents" />}
          />
          <DetailItem
            label="Training material"
            value={<FileLink href={trainingUrl} label="View training material" />}
          />
          <DetailItem
            label="Commercial terms shared"
            value={labelFor(
              dealer.commercial_terms_shared,
              commercialTermsSharedOptions
            )}
          />
          <DetailItem
            label="Credit terms"
            value={labelFor(dealer.credit_terms, creditTermsOptions)}
          />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-slate-950">
          Onboarding progress
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem
            label="Commercial terms shared"
            value={labelFor(
              dealer.commercial_terms_shared,
              commercialTermsSharedOptions
            )}
          />
          <DetailItem
            label="Training completed"
            value={
              dealer.training_status === "Training Completed"
                ? "Yes"
                : labelFor(dealer.training_status, trainingStatusOptions)
            }
          />
          <DetailItem
            label="Agreement status"
            value={labelFor(
              dealer.dealer_agreement_status,
              dealerAgreementStatusOptions
            )}
          />
          <DetailItem
            label="Legal approval"
            value={display(dealer.dealer_agreement_approval_status)}
          />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-slate-950">
          Commercial and operations progress
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem
            label="First order expected"
            value={formatDate(dealer.first_order_target_date)}
          />
          <DetailItem
            label="Dealer stock dispatched"
            value={dealerDispatches.length > 0 ? "Yes" : "No"}
          />
          <DetailItem
            label="First farmer installation done"
            value={firstFarmerInstallationDone ? "Yes" : "No"}
          />
          <DetailItem
            label="Last farmer installation date"
            value={formatDate(dealer.last_farmer_installation_date)}
          />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-slate-950">Targets</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <DetailItem
            label="Monthly dealer sales target"
            value={dealer.monthly_installation_target}
          />
          <DetailItem
            label="Quarterly dealer sales target"
            value={dealer.quarterly_installation_target}
          />
          <DetailItem
            label="Annual dealer sales target"
            value={dealer.annual_installation_target}
          />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-slate-950">
          Review and next action
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem
            label="Last dealer review date"
            value={formatDate(dealer.last_dealer_review_date)}
          />
          <DetailItem
            label="Next dealer review date"
            value={formatDate(dealer.next_dealer_review_date)}
          />
          <DetailItem
            label="Next action date"
            value={formatDate(dealer.next_action_date)}
          />
          <DetailItem
            label="Concern / blocker"
            value={display(dealer.support_required)}
          />
          <DetailItem label="Remarks" value={display(dealer.remarks)} />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Dealer stock
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {dealerDevices.length} devices with dealer ·{" "}
              {dealerDispatches.length} dispatched this month
            </p>
          </div>
        </div>
        {dealerDevices.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Serial number</th>
                  <th className="px-4 py-3">Product model</th>
                  <th className="px-4 py-3">Dispatch date</th>
                  <th className="px-4 py-3">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dealerDevices.map((device) => (
                  <tr key={device.id}>
                    <td className="px-4 py-3 font-semibold text-slate-950">
                      {device.serial_number}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {labelFor(device.product_model, productModelOptions)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(device.dispatch_date)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        className="text-brand-700 hover:text-brand-800"
                        href={`/devices/${device.id}`}
                      >
                        Open device
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-sm text-slate-500">
            No devices are currently held by this dealer.
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">
            Dealer linked leads
          </h2>
        </div>
        {linkedLeads.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Farmer</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {linkedLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-4 py-3">
                      <Link
                        className="font-semibold text-brand-700 hover:text-brand-800"
                        href={`/farmer-leads/${lead.id}`}
                      >
                        {lead.lead_code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{lead.farmer_name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {lead.mobile_number}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {lead.village}, {lead.district}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {lead.funnel_stage}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {lead.lead_status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-sm text-slate-500">
            No farmer leads are linked to this dealer yet.
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">
            Dealer-linked pilots
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Farmer pilots conducted through this dealer.
          </p>
        </div>
        {relatedPilotsList.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Pilot</th>
                  <th className="px-4 py-3">Farmer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {relatedPilotsList.map((pilot) => (
                  <tr key={pilot.id}>
                    <td className="px-4 py-3">
                      <Link
                        className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                        href={`/pilots/${pilot.id}`}
                      >
                        {pilot.pilot_code} · {pilot.pilot_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {pilot.farmer_name_snapshot}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {pilot.pilot_type}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {pilot.pilot_status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-sm text-slate-500">
            No pilots are linked to this dealer yet.
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">
            Dealer installations
          </h2>
        </div>
        {dealerInstallations.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Installation</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Farmer</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dealerInstallations.map((installation) => (
                  <tr key={installation.id}>
                    <td className="px-4 py-3">
                      <Link
                        className="font-semibold text-brand-700 hover:text-brand-800"
                        href={`/installations/${installation.id}`}
                      >
                        {installation.installation_code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(installation.installation_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {installation.farmer_name_snapshot}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{installation.serial_number_snapshot}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {labelFor(installation.product_model, productModelOptions)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {installation.installation_status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-sm text-slate-500">
            No installations are linked to this dealer yet.
          </div>
        )}
      </div>
    </section>
  );
}
