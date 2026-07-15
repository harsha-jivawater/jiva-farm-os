import Link from "next/link";
import { Pencil, Plus, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DeactivateUserButton } from "@/components/internal-users/deactivate-user-button";
import { ReactivateUserButton } from "@/components/internal-users/reactivate-user-button";
import {
  deactivateInternalUserAction,
  reactivateInternalUserAction,
} from "@/app/(app)/internal-users/actions";
import {
  deactivationConfirmationMessage,
  reactivationMessage
} from "@/lib/users/messages";
import { createClient } from "@/lib/supabase/server";
import { labelForRole } from "@/lib/users/options";
import { display, formatDateTime, type InternalUser } from "@/lib/users/types";

type InternalUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function statusPill(isActive: boolean) {
  return isActive ? (
    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
      Active
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
      Inactive
    </span>
  );
}

type UserUsage = {
  created: number;
  assigned: number;
  fieldActivity: number;
};

type UserReferenceRow = Record<string, string | null | undefined>;

function buildUserUsage(
  users: InternalUser[],
  datasets: Array<{
    rows: UserReferenceRow[];
    createdFields?: string[];
    assignedFields?: string[];
    activityFields?: string[];
  }>
) {
  const usage = new Map<string, UserUsage>(
    users.map((user) => [user.id, { created: 0, assigned: 0, fieldActivity: 0 }])
  );

  for (const dataset of datasets) {
    for (const row of dataset.rows) {
      for (const field of dataset.createdFields ?? []) {
        const userId = row[field];
        if (userId && usage.has(userId)) {
          usage.get(userId)!.created += 1;
        }
      }
      for (const field of dataset.assignedFields ?? []) {
        const userId = row[field];
        if (userId && usage.has(userId)) {
          usage.get(userId)!.assigned += 1;
        }
      }
      for (const field of dataset.activityFields ?? []) {
        const userId = row[field];
        if (userId && usage.has(userId)) {
          usage.get(userId)!.fieldActivity += 1;
        }
      }
    }
  }

  return usage;
}

export default async function InternalUsersPage({
  searchParams
}: InternalUsersPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const [
    { data: usersData, error },
    { data: regionsData },
    { data: farmerLeadUsage },
    { data: dealerUsage },
    { data: institutionUsage },
    { data: pilotUsage },
    { data: pilotVisitUsage },
    { data: visitReportUsage },
    { data: followupUsage },
    { data: installationUsage },
    { data: meetingUsage }
  ] = await Promise.all([
    supabase.from("users").select("*").order("is_active", { ascending: false }).order("full_name"),
    supabase.from("regions").select("*").order("region_name"),
    supabase
      .from("farmer_leads")
      .select("created_by_user_id, owner_user_id, followup_owner_user_id")
      .is("deleted_at", null),
    supabase
      .from("dealers")
      .select("created_by_user_id, dealer_owner_user_id")
      .is("deleted_at", null),
    supabase
      .from("institutions")
      .select("created_by_user_id, account_owner_user_id, sales_head_user_id, rsm_user_id, rd_head_user_id, technical_owner_user_id")
      .is("deleted_at", null),
    supabase
      .from("pilots")
      .select("created_by_user_id, pilot_owner_user_id, research_assistant_user_id, agronomist_user_id, rd_head_user_id, rsm_user_id")
      .is("deleted_at", null),
    supabase
      .from("pilot_visits")
      .select("visited_by_user_id, accompanied_by_user_id, rd_head_user_id")
      .is("deleted_at", null),
    supabase
      .from("visit_reports")
      .select("submitted_by_user_id, reviewed_by_user_id")
      .is("deleted_at", null),
    supabase
      .from("followups")
      .select("created_by_user_id, followup_owner_user_id")
      .is("deleted_at", null),
    supabase
      .from("installations")
      .select("created_by_user_id, installed_by_user_id, verified_by_user_id, followup_owner_user_id")
      .is("deleted_at", null),
    supabase
      .from("institution_meetings")
      .select("created_by_user_id, primary_internal_owner_user_id, rsm_user_id, sales_head_user_id, rd_head_user_id, agronomist_user_id")
  ]);
  const users = (usersData ?? []) as InternalUser[];
  const activeUsers = users.filter((user) => user.is_active);
  const usage = buildUserUsage(users, [
    {
      rows: (farmerLeadUsage ?? []) as UserReferenceRow[],
      createdFields: ["created_by_user_id"],
      assignedFields: ["owner_user_id", "followup_owner_user_id"]
    },
    {
      rows: (dealerUsage ?? []) as UserReferenceRow[],
      createdFields: ["created_by_user_id"],
      assignedFields: ["dealer_owner_user_id"]
    },
    {
      rows: (institutionUsage ?? []) as UserReferenceRow[],
      createdFields: ["created_by_user_id"],
      assignedFields: [
        "account_owner_user_id",
        "sales_head_user_id",
        "rsm_user_id",
        "rd_head_user_id",
        "technical_owner_user_id"
      ]
    },
    {
      rows: (pilotUsage ?? []) as UserReferenceRow[],
      createdFields: ["created_by_user_id"],
      assignedFields: [
        "pilot_owner_user_id",
        "research_assistant_user_id",
        "agronomist_user_id",
        "rd_head_user_id",
        "rsm_user_id"
      ]
    },
    {
      rows: (pilotVisitUsage ?? []) as UserReferenceRow[],
      assignedFields: ["visited_by_user_id", "accompanied_by_user_id", "rd_head_user_id"],
      activityFields: ["visited_by_user_id", "accompanied_by_user_id"]
    },
    {
      rows: (visitReportUsage ?? []) as UserReferenceRow[],
      assignedFields: ["reviewed_by_user_id"],
      activityFields: ["submitted_by_user_id"]
    },
    {
      rows: (followupUsage ?? []) as UserReferenceRow[],
      createdFields: ["created_by_user_id"],
      assignedFields: ["followup_owner_user_id"]
    },
    {
      rows: (installationUsage ?? []) as UserReferenceRow[],
      createdFields: ["created_by_user_id"],
      assignedFields: ["installed_by_user_id", "verified_by_user_id", "followup_owner_user_id"],
      activityFields: ["installed_by_user_id", "verified_by_user_id"]
    },
    {
      rows: (meetingUsage ?? []) as UserReferenceRow[],
      createdFields: ["created_by_user_id"],
      assignedFields: [
        "primary_internal_owner_user_id",
        "rsm_user_id",
        "sales_head_user_id",
        "rd_head_user_id",
        "agronomist_user_id"
      ]
    }
  ]);
  const usageTotals = Array.from(usage.values()).reduce(
    (totals, item) => ({
      created: totals.created + item.created,
      assigned: totals.assigned + item.assigned,
      fieldActivity: totals.fieldActivity + item.fieldActivity
    }),
    { created: 0, assigned: 0, fieldActivity: 0 }
  );
  const regionMap = new Map(
    (regionsData ?? []).map((region) => [region.id, region.region_name])
  );
  const errorMessage = paramValue(params.error);
  const reactivated = paramValue(params.reactivated);
  const reactivatedMessage = paramValue(params.message);
  const showDeactivationSummary = paramValue(params.deactivated) === "1";

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Network"
          title="Internal Users"
          description="Manage team profiles, active status, ownership transfer, and what each person can access."
        />
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          href="/internal-users/new"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add user
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error.message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {showDeactivationSummary ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          <p className="font-semibold">User deactivated and responsibilities transferred.</p>
          <div className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            <p>Farmer leads reassigned: {paramValue(params.fl) || "0"}</p>
            <p>Dealers reassigned: {paramValue(params.dl) || "0"}</p>
            <p>Institutions reassigned: {paramValue(params.in) || "0"}</p>
            <p>Pilots reassigned: {paramValue(params.pi) || "0"}</p>
            <p>Follow-ups reassigned: {paramValue(params.fu) || "0"}</p>
            <p>
              Future meetings/visits reassigned: {paramValue(params.mv) || "0"}
            </p>
          </div>
        </div>
      ) : null}

      {reactivated ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          {reactivatedMessage || reactivationMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Users</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {users.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active Users</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {activeUsers.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Inactive Users</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {users.length - activeUsers.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Domain Rule</p>
          <p className="mt-3 text-lg font-semibold text-slate-950">
            @jivawater.com
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Records Created</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {usageTotals.created}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Current Assignments</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {usageTotals.assigned}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Field Activity</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {usageTotals.fieldActivity}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Replacement</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-slate-500"
                    colSpan={8}
                  >
                    No internal users found. Add a team member to start assigning work.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const deactivateAction = deactivateInternalUserAction.bind(
                    null,
                    user.id
                  );
                  const reactivateAction = reactivateInternalUserAction.bind(
                    null,
                    user.id
                  );
                  const replacementUser = user.replacement_user_id
                    ? users.find(
                        (item) => item.id === user.replacement_user_id
                      )
                    : null;
                  const userUsage = usage.get(user.id) ?? {
                    created: 0,
                    assigned: 0,
                    fieldActivity: 0
                  };

                  return (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-950">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                        {!user.is_active && user.deactivated_at ? (
                          <p className="mt-1 text-xs text-slate-400">
                            Deactivated {formatDateTime(user.deactivated_at)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {labelForRole(user.role)}
                        {user.secondary_role ? (
                          <span className="mt-1 block text-xs text-slate-500">
                            Secondary: {labelForRole(user.secondary_role)}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {user.region_id
                          ? display(regionMap.get(user.region_id))
                          : "Not set"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {display(user.state)}
                      </td>
                      <td className="px-4 py-3">{statusPill(user.is_active)}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {replacementUser?.full_name ?? "Not set"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <p>Created: {userUsage.created}</p>
                        <p>Assigned: {userUsage.assigned}</p>
                        <p>Field activity: {userUsage.fieldActivity}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                            href={`/internal-users/${user.id}/edit`}
                            prefetch={false}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Edit
                          </Link>
                          {user.is_active ? (
                            <DeactivateUserButton
                              action={deactivateAction}
                              confirmationMessage={
                                deactivationConfirmationMessage
                              }
                              replacementUsers={activeUsers}
                              user={user}
                            />
                          ) : (
                            <ReactivateUserButton
                              action={reactivateAction}
                              message={reactivationMessage}
                            />
                          )}
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

      <div className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
        <p>
          Users are deactivated, not deleted. Action history remains linked to
          the original user.
        </p>
      </div>
    </section>
  );
}
