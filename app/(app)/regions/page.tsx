import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RegionStatusButton } from "@/components/regions/region-status-button";
import {
  deactivateRegionAction,
  reactivateRegionAction
} from "@/app/(app)/regions/actions";
import { createClient } from "@/lib/supabase/server";
import { display, formatDate, type Region } from "@/lib/regions/types";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import {
  canDeactivateRegions,
  canWriteModule
} from "@/lib/users/permissions";

type RegionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function RegionsPage({ searchParams }: RegionsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/regions");
  const status = paramValue(params.status);
  const error = paramValue(params.error);
  const updated = paramValue(params.updated);
  const [{ data: regionsData }, { data: usersData }] = await Promise.all([
    supabase
      .from("regions")
      .select("*")
      .order("is_active", { ascending: false })
      .order("region_name", { ascending: true }),
    supabase.from("users").select("id, full_name, role").order("full_name")
  ]);
  let regions = (regionsData ?? []) as Region[];

  if (status === "active") {
    regions = regions.filter((region) => region.is_active);
  } else if (status === "inactive") {
    regions = regions.filter((region) => !region.is_active);
  }

  const userMap = new Map(
    (usersData ?? []).map((user) => [
      user.id,
      `${user.full_name} - ${labelForRole(user.role)}`
    ])
  );
  const canWrite = canWriteModule(currentUser, "regions");
  const canDeactivate = canDeactivateRegions(currentUser);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Network"
          title="Regions"
          description="Manage sales regions, RSM assignment, and annual device targets."
        />
        {canWrite ? (
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            href="/regions/new"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add region
          </Link>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      {updated ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          Region status updated.
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["", "All"],
          ["active", "Active"],
          ["inactive", "Inactive"]
        ].map(([value, label]) => (
          <Link
            className={[
              "inline-flex min-h-9 items-center rounded-md border px-3 py-2 text-sm font-semibold shadow-sm",
              status === value || (!status && !value)
                ? "border-brand-200 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            ].join(" ")}
            href={value ? `/regions?status=${value}` : "/regions"}
            key={value}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">RSM</th>
                <th className="px-4 py-3">Annual Target</th>
                <th className="px-4 py-3">FY</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regions.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-slate-500"
                    colSpan={7}
                  >
                    No regions found. Add a region to start assigning users and records.
                  </td>
                </tr>
              ) : (
                regions.map((region) => {
                  const deactivateAction = deactivateRegionAction.bind(
                    null,
                    region.id
                  );
                  const reactivateAction = reactivateRegionAction.bind(
                    null,
                    region.id
                  );

                  return (
                    <tr key={region.id}>
                      <td className="px-4 py-3 font-medium text-slate-950">
                        {region.region_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {region.state}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {region.rsm_user_id
                          ? display(userMap.get(region.rsm_user_id))
                          : "Sales Head/Admin accountable"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {region.annual_device_target.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(region.fy_start_date)} to{" "}
                        {formatDate(region.fy_end_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                            region.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          ].join(" ")}
                        >
                          {region.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {canWrite ? (
                            <Link
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                              href={`/regions/${region.id}/edit`}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                              Edit
                            </Link>
                          ) : null}
                          {canDeactivate ? (
                            <RegionStatusButton
                              action={
                                region.is_active
                                  ? deactivateAction
                                  : reactivateAction
                              }
                              active={region.is_active}
                            />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
