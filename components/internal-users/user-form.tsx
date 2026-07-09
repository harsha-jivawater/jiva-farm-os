"use client";

import Link from "next/link";
import { useState } from "react";
import { Save } from "lucide-react";
import {
  labelForRole,
  managerRolesForRole,
  userRoleOptions
} from "@/lib/users/options";
import { hasAnyRole } from "@/lib/users/permissions";
import type { InternalUser, Region } from "@/lib/users/types";
import { INDIAN_STATES_AND_UTS } from "@/src/lib/india-locations";

type UserFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  regions: Region[];
  users: InternalUser[];
  user?: InternalUser;
};

export function UserForm({
  action,
  error,
  regions,
  users,
  user
}: UserFormProps) {
  const [selectedRole, setSelectedRole] = useState(user?.role ?? "Salesperson");
  const activeUsers = users.filter(
    (item) => item.is_active && item.id !== user?.id
  );
  const managerRoles = managerRolesForRole(selectedRole);
  const managerOptions =
    managerRoles.length > 0
      ? activeUsers.filter((item) => hasAnyRole(item, managerRoles))
      : activeUsers;

  return (
    <form action={action} className="space-y-6">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">User profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Full name
            <input
              className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              defaultValue={user?.full_name ?? ""}
              name="full_name"
              required
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Email
            <input
              className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              defaultValue={user?.email ?? ""}
              name="email"
              placeholder="name@jivawater.com"
              required
              type="email"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Phone
            <input
              className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              defaultValue={user?.phone ?? ""}
              name="phone"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Primary Role
            <select
              className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              name="role"
              onChange={(event) => setSelectedRole(event.target.value)}
              required
              value={selectedRole}
            >
              {userRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Secondary Role
            <select
              className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              defaultValue={user?.secondary_role ?? ""}
              name="secondary_role"
            >
              <option value="">No secondary role</option>
              {userRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-xs font-normal text-slate-500">
              Optional. Adds access without removing the primary role.
            </span>
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Region
            <select
              className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              defaultValue={user?.region_id ?? ""}
              name="region_id"
            >
              <option value="">No region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.region_name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            State
            <select
              className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              defaultValue={user?.state ?? ""}
              name="state"
            >
              <option value="">No state</option>
              {INDIAN_STATES_AND_UTS.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700 md:col-span-2">
            Reports to
            <select
              className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              defaultValue={user?.reports_to_user_id ?? ""}
              name="reports_to_user_id"
            >
              <option value="">No reporting manager</option>
              {managerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.full_name} - {labelForRole(option.role)}
                </option>
              ))}
            </select>
            {managerRoles.length > 0 ? (
              <span className="text-xs font-normal text-slate-500">
                {labelForRole(selectedRole)} reports to active{" "}
                {managerRoles.map(labelForRole).join(" or ")}.
              </span>
            ) : null}
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Permissions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              checked: user?.can_create_leads,
              label: "Can create leads",
              name: "can_create_leads"
            },
            {
              checked: user?.can_own_pilots,
              label: "Can own pilots",
              name: "can_own_pilots"
            },
            {
              checked: user?.can_confirm_payment,
              label: "Can confirm payment",
              name: "can_confirm_payment"
            },
            {
              checked: user?.can_manage_dispatch,
              label: "Can manage dispatch",
              name: "can_manage_dispatch"
            },
            {
              checked: user?.can_download_csv,
              helper: "Allows this user to export permitted records as CSV.",
              label: "Can download CSV files",
              name: "can_download_csv"
            }
          ].map((permission) => (
            <label
              className="flex min-h-11 items-start gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
              key={permission.name}
            >
              <input
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                defaultChecked={Boolean(permission.checked)}
                name={permission.name}
                type="checkbox"
              />
              <span>
                {permission.label}
                {permission.helper ? (
                  <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
                    {permission.helper}
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          type="submit"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Save user
        </button>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          href="/internal-users"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
