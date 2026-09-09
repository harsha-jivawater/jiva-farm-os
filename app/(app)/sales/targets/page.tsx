import { LiveFilterForm } from "@/components/filters/live-filter-form";
import { PageHeader } from "@/components/page-header";
import { TargetMatrix } from "@/components/sales/target-matrix";
import { createSalesTargetAction } from "@/app/(app)/sales/actions";
import {
  currentFinancialYearStart,
  normalizeFinancialYearStart,
  regionalTargetPreset,
  salesFinancialYearMonths,
  salesFinancialYearRange
} from "@/lib/sales/dashboard";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { hasAnyRole, hasRole } from "@/lib/users/permissions";

type SalesTargetsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type TargetOwner = {
  full_name: string;
  id: string;
  role: string;
  secondary_role: string | null;
  state: string | null;
};

function paramValue(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const entry = params[key];
  return Array.isArray(entry) ? entry[0] ?? "" : entry ?? "";
}

function ownerLabel(owner: TargetOwner) {
  const role = hasRole(owner, "Sales Head") ? "Sales Head" : "RSM";
  return `${owner.full_name} · ${role}${owner.state ? ` · ${owner.state}` : ""}`;
}

export default async function SalesTargetsPage({
  searchParams
}: SalesTargetsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(supabase, "/sales/targets");
  const canManageMatrix = hasAnyRole(profile, ["Admin", "Sales Head"]);
  const isRsm = hasRole(profile, "RSM");
  const financialYearStart = normalizeFinancialYearStart(params.fy);
  const months = salesFinancialYearMonths(financialYearStart);
  const range = salesFinancialYearRange(financialYearStart);
  const requestedOwnerId = paramValue(params, "rsm_user_id");

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id,full_name,role,secondary_role,state")
    .eq("is_active", true)
    .order("full_name", { ascending: true });
  if (userError) throw userError;
  const targetOwners = ((userData ?? []) as TargetOwner[]).filter(
    (user) => hasRole(user, "RSM") || hasRole(user, "Sales Head")
  );
  const selectedOwnerId = canManageMatrix
    ? targetOwners.some((owner) => owner.id === requestedOwnerId)
      ? requestedOwnerId
      : targetOwners.find((owner) => hasRole(owner, "RSM"))?.id ??
        targetOwners[0]?.id ??
        ""
    : isRsm
      ? profile.id
      : "";
  const selectedOwner = targetOwners.find(
    (owner) => owner.id === selectedOwnerId
  );
  const selectedOwnerType = selectedOwner && hasRole(selectedOwner, "Sales Head")
    ? "sales_head"
    : "rsm";

  const [{ data: selectedTargets, error: selectedTargetsError }, { data: targets, error: targetsError }] =
    await Promise.all([
      selectedOwnerId
        ? supabase
            .from("sales_targets")
            .select("month_start,target_devices,status")
            .eq("owner_type", selectedOwnerType)
            .eq("owner_user_id", selectedOwnerId)
            .gte("month_start", range.start)
            .lt("month_start", range.endExclusive)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("sales_targets")
        .select("id,month_start,owner_type,owner_user_id,target_devices,status")
        .order("month_start", { ascending: false })
        .limit(150)
    ]);
  if (selectedTargetsError) throw selectedTargetsError;
  if (targetsError) throw targetsError;

  const savedByMonth = new Map(
    (selectedTargets ?? []).map((target) => [target.month_start, target.target_devices])
  );
  const preset =
    selectedOwnerType === "rsm"
      ? regionalTargetPreset(selectedOwner?.state, financialYearStart)
      : null;
  const usingPreset = savedByMonth.size === 0 && Boolean(preset);
  const initialValues = months.map((month, index) =>
    savedByMonth.has(month.monthStart)
      ? savedByMonth.get(month.monthStart) ?? 0
      : usingPreset
        ? preset?.[index] ?? 0
        : 0
  );
  const namesById = new Map(
    targetOwners.map((owner) => [owner.id, owner.full_name])
  );
  const fyOptions = Array.from(
    { length: 4 },
    (_, index) => currentFinancialYearStart() - 1 + index
  );
  const saved = paramValue(params, "saved") === "1";
  const error = paramValue(params, "error");

  return (
    <section>
      <PageHeader
        eyebrow="Sales operations"
        title="Targets and approval"
        description="Set combined device targets month by month. RSM submissions require Sales Head approval."
      />

      {saved ? (
        <p className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Targets saved and approved. The Sales dashboard now uses these figures.
        </p>
      ) : null}
      {error ? (
        <p className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </p>
      ) : null}

      {canManageMatrix ? (
        <>
          <LiveFilterForm className="mb-5 grid gap-4 border-y border-slate-200 py-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Target owner
              <select
                className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3"
                defaultValue={selectedOwnerId}
                name="rsm_user_id"
              >
                {targetOwners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {ownerLabel(owner)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Financial year
              <select
                className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3"
                defaultValue={financialYearStart}
                name="fy"
              >
                {fyOptions.map((year) => (
                  <option key={year} value={year}>
                    FY {year}-{String(year + 1).slice(-2)}
                  </option>
                ))}
              </select>
            </label>
          </LiveFilterForm>

          {selectedOwner ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <TargetMatrix
                financialYearStart={financialYearStart}
                initialValues={initialValues}
                months={months}
                ownerName={ownerLabel(selectedOwner)}
                ownerUserId={selectedOwner.id}
                usingPreset={usingPreset}
              />
            </div>
          ) : (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No active RSM or Sales Head is available for target assignment.
            </p>
          )}
        </>
      ) : isRsm ? (
        <form
          action={createSalesTargetAction}
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <input name="owner_user_id" type="hidden" value={profile.id} />
          <label className="block text-sm font-medium text-slate-700">
            Month
            <input
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3"
              name="month_start"
              required
              type="month"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Combined device target
            <input
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3"
              min="0"
              name="target_devices"
              required
              type="number"
            />
          </label>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
            type="submit"
          >
            Submit for approval
          </button>
        </form>
      ) : null}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-950">Target register</h2>
          <p className="text-sm text-slate-500">Latest 150 records</p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Month</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 text-right font-semibold">Target</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(targets ?? []).length ? (
                (targets ?? []).map((target) => (
                  <tr key={target.id}>
                    <td className="px-4 py-3 text-slate-700">{target.month_start.slice(0, 7)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {namesById.get(target.owner_user_id) ?? "Unavailable user"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {target.owner_type === "sales_head" ? "Sales Head" : "RSM"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-950">
                      {target.target_devices.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">{target.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                    No targets have been submitted.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
