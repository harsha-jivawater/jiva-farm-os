import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Pencil,
  XCircle
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FileLink } from "@/components/uploads/file-link";
import { StatusPill } from "@/components/farmer-leads/status-pill";
import { confirmFarmerLeadPaymentAction } from "@/app/(app)/farmer-leads/actions";
import {
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
};

function display(value: string | null | undefined) {
  return value || "Not set";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

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

function BooleanBadge({ active, label }: { active: boolean; label: string }) {
  const Icon = active ? CheckCircle2 : XCircle;

  return (
    <span
      className={[
        "inline-flex min-h-8 items-center gap-2 rounded-md border px-3 py-1 text-sm font-semibold",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      ].join(" ")}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </span>
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
    ? `${user.full_name} · ${user.email} · ${labelForRole(user.role)}`
    : display(fallback);
}

export default async function FarmerLeadDetailPage({
  params
}: FarmerLeadDetailPageProps) {
  const { id } = await params;
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
    new Set([lead.owner_user_id, lead.rsm_user_id].filter(Boolean))
  );
  const [{ data: users }, leadPhotosUrl, farmerDocumentUrl] = await Promise.all([
    userIds.length
      ? supabase
          .from("users")
          .select("id, full_name, email, role")
          .in("id", userIds)
      : Promise.resolve({ data: [] }),
    resolveFileUrl(supabase, lead.lead_photo_folder_link),
    resolveFileUrl(supabase, lead.farmer_document_link)
  ]);
  const userMap = new Map((users ?? []).map((user) => [user.id, user]));
  const confirmPaymentAction = confirmFarmerLeadPaymentAction.bind(null, lead.id);
  const canConfirmLeadPayment = canConfirmPayment(currentUser);
  const hasInconsistentDeviceInstalledStage =
    lead.funnel_stage === "Device Installed" && !lead.installation_completed;
  const canSeeWorkflowWarning = hasAnyRole(currentUser, ["Admin", "Management"]);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Farmer Lead"
          title={lead.farmer_name}
          description={`${display(lead.lead_code)} · ${display(lead.village)}`}
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
        <BooleanBadge
          active={Boolean(lead.payment_confirmed)}
          label="Payment confirmed"
        />
        <BooleanBadge
          active={Boolean(lead.device_dispatched)}
          label="Device dispatched"
        />
        <BooleanBadge
          active={Boolean(lead.installation_completed)}
          label="Device installed"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Mobile number" value={display(lead.mobile_number)} />
        <DetailItem label="Village" value={display(lead.village)} />
        <DetailItem label="District" value={display(lead.district)} />
        <DetailItem label="State" value={display(lead.state)} />
        <DetailItem
          label="Funnel stage"
          value={labelFor(lead.funnel_stage, funnelStageOptions)}
        />
        <DetailItem
          label="Lead source"
          value={labelFor(lead.lead_source, leadSourceOptions)}
        />
        <DetailItem label="Primary crop" value={formatCrop(lead)} />
        <DetailItem
          label="Next follow-up"
          value={formatDate(lead.followup_due_date)}
        />
        <DetailItem
          label="Owner user"
          value={userLabel(userMap.get(lead.owner_user_id), lead.owner_user_id)}
        />
        <DetailItem
          label="RSM"
          value={userLabel(userMap.get(lead.rsm_user_id), lead.rsm_user_id)}
        />
        <DetailItem
          label="Lead photos"
          value={<FileLink href={leadPhotosUrl} label="View lead photos" />}
        />
        <DetailItem
          label="Farmer document"
          value={
            <FileLink href={farmerDocumentUrl} label="View farmer document" />
          }
        />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Notes</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {display(lead.remarks)}
        </p>
      </div>
    </section>
  );
}
