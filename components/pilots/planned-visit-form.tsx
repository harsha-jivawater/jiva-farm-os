"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { CalendarPlus } from "lucide-react";
import { todayDate } from "@/lib/pilots/form-data";
import {
  defaultPlannedVisitStatus,
  defaultPlannedVisitType,
  plannedVisitStatusOptions,
  plannedVisitTypeOptions,
  visitParameterOptions
} from "@/lib/pilots/visit-planning";
import { labelForRole } from "@/lib/users/options";
import { hasAnyRole } from "@/lib/users/permissions";
import type { PlannedPilotVisit, UserOption } from "@/lib/pilots/types";

type PlannedVisitFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
  compact?: boolean;
  defaultAssigneeId?: string | null;
  nextVisitNumber?: number;
  users: UserOption[];
  visit?: PlannedPilotVisit;
};

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function textareaClassName() {
  return "min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function SubmitButton({ compact = false }: { compact?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={pending}
      type="submit"
    >
      <CalendarPlus className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saving..." : compact ? "Add planned visit" : "Save planned visit"}
    </button>
  );
}

export function PlannedVisitForm({
  action,
  cancelHref,
  compact = false,
  defaultAssigneeId,
  nextVisitNumber = 1,
  users,
  visit
}: PlannedVisitFormProps) {
  const assignableUsers = users.filter((user) =>
    hasAnyRole(user, ["Research Assistant"])
  );
  const selectedParameters = new Set(visit?.parameters_to_collect ?? []);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="visit_number">
            Visit number
          </label>
          <input
            className={inputClassName()}
            defaultValue={visit?.visit_number ?? nextVisitNumber}
            id="visit_number"
            min={1}
            name="visit_number"
            required
            type="number"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="planned_visit_date">
            Planned visit date
          </label>
          <input
            className={inputClassName()}
            defaultValue={visit?.planned_visit_date ?? todayDate()}
            id="planned_visit_date"
            name="planned_visit_date"
            required
            type="date"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="visit_type">
            Visit type
          </label>
          <select
            className={inputClassName()}
            defaultValue={visit?.visit_type ?? defaultPlannedVisitType}
            id="visit_type"
            name="visit_type"
            required
          >
            {plannedVisitTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="planned_visit_status">
            Visit status
          </label>
          <select
            className={inputClassName()}
            defaultValue={visit?.planned_visit_status ?? defaultPlannedVisitStatus}
            id="planned_visit_status"
            name="planned_visit_status"
            required
          >
            {plannedVisitStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="assigned_user_id">
            Assigned Research Assistant
          </label>
          <select
            className={inputClassName()}
            defaultValue={visit?.assigned_user_id ?? defaultAssigneeId ?? ""}
            id="assigned_user_id"
            name="assigned_user_id"
            required
          >
            <option value="">Select Research Assistant</option>
            {assignableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} · {labelForRole(user.role)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="crop_stage_timing">
            Crop stage / timing
          </label>
          <input
            className={inputClassName()}
            defaultValue={visit?.crop_stage_timing ?? ""}
            id="crop_stage_timing"
            name="crop_stage_timing"
            placeholder="Example: 30 DAS, flowering, harvest"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="visit_purpose">
          Visit purpose
        </label>
        <textarea
          className={textareaClassName()}
          defaultValue={visit?.visit_purpose ?? ""}
          id="visit_purpose"
          name="visit_purpose"
          required
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Parameters to collect</p>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {visitParameterOptions.map((parameter) => (
            <label
              className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
              key={parameter}
            >
              <input
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                defaultChecked={selectedParameters.has(parameter)}
                name="parameters_to_collect"
                type="checkbox"
                value={parameter}
              />
              {parameter}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="special_instructions">
          Special instructions
        </label>
        <textarea
          className={textareaClassName()}
          defaultValue={visit?.special_instructions ?? ""}
          id="special_instructions"
          name="special_instructions"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {cancelHref ? (
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href={cancelHref}
          >
            Cancel
          </Link>
        ) : null}
        <SubmitButton compact={compact} />
      </div>
    </form>
  );
}
