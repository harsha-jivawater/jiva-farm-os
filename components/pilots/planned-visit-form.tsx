"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { CalendarPlus } from "lucide-react";
import { todayDate } from "@/lib/pilots/form-data";
import {
  defaultPlannedVisitStatus,
  defaultPlannedVisitType,
  displayVisitParameter,
  plannedVisitStatusOptions,
  plannedVisitTypeOptions,
  visitParameterOptions
} from "@/lib/pilots/visit-planning";
import { labelForRole } from "@/lib/users/options";
import { hasAnyRole } from "@/lib/users/permissions";
import type { PlannedPilotVisit, UserOption } from "@/lib/pilots/types";

type PlannedVisitFormProps = {
  action?: (
    state: PlannedVisitActionState,
    formData: FormData
  ) => Promise<PlannedVisitActionState>;
  cancelHref?: string;
  compact?: boolean;
  defaultAssigneeId?: string | null;
  fieldPrefix?: string;
  nextVisitNumber?: number;
  showSubmit?: boolean;
  submitLabel?: string;
  users: UserOption[];
  visit?: PlannedPilotVisit;
};

export type PlannedVisitActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

const initialActionState: PlannedVisitActionState = {
  status: "idle",
  message: null
};
const visitAssigneeRoles = ["Agronomist", "Research Assistant", "R&D Head"];

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function textareaClassName() {
  return "min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function SubmitButton({
  compact = false,
  submitLabel
}: {
  compact?: boolean;
  submitLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={pending}
      type="submit"
    >
      <CalendarPlus className="h-4 w-4" aria-hidden="true" />
      {pending
        ? "Saving..."
        : submitLabel ?? (compact ? "Save visit" : "Save planned visit")}
    </button>
  );
}

export function PlannedVisitForm({
  action,
  cancelHref,
  compact = false,
  defaultAssigneeId,
  fieldPrefix = "",
  nextVisitNumber = 1,
  showSubmit = true,
  submitLabel,
  users,
  visit
}: PlannedVisitFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    action ??
      (async () => ({
        status: "error" as const,
        message: "This form is not ready to save."
      })),
    initialActionState
  );
  const assignableUsers = users.filter((user) =>
    hasAnyRole(user, visitAssigneeRoles)
  );
  const [selectedParameters, setSelectedParameters] = useState<string[]>(
    visit?.parameters_to_collect ?? []
  );
  const selectedParameterSet = new Set(selectedParameters);
  const showStatus = Boolean(visit);

  function fieldName(name: string) {
    return `${fieldPrefix}${name}`;
  }

  function toggleParameter(parameter: string, checked: boolean) {
    setSelectedParameters((current) => {
      if (checked) {
        return current.includes(parameter) ? current : [...current, parameter];
      }

      return current.filter((value) => value !== parameter);
    });
  }

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.closest("details")?.removeAttribute("open");
      router.refresh();
    }
  }, [router, state.status]);

  const content = (
    <>
      {showSubmit && state.message ? (
        <div
          className={[
            "rounded-md border px-3 py-2 text-sm leading-6",
            state.status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          ].join(" ")}
        >
          {state.message}
        </div>
      ) : null}
      <input
        name={fieldName("visit_number")}
        type="hidden"
        value={visit?.visit_number ?? nextVisitNumber}
      />
      {!showStatus ? (
        <input
          name={fieldName("planned_visit_status")}
          type="hidden"
          value={defaultPlannedVisitStatus}
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor={fieldName("planned_visit_date")}
          >
            Planned visit date
          </label>
          <input
            className={inputClassName()}
            defaultValue={visit?.planned_visit_date ?? todayDate()}
            id={fieldName("planned_visit_date")}
            name={fieldName("planned_visit_date")}
            required
            type="date"
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor={fieldName("visit_type")}
          >
            Visit type
          </label>
          <select
            className={inputClassName()}
            defaultValue={visit?.visit_type ?? defaultPlannedVisitType}
            id={fieldName("visit_type")}
            name={fieldName("visit_type")}
            required
          >
            {plannedVisitTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {showStatus ? (
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor={fieldName("planned_visit_status")}
            >
              Visit status
            </label>
            <select
              className={inputClassName()}
              defaultValue={visit?.planned_visit_status ?? defaultPlannedVisitStatus}
              id={fieldName("planned_visit_status")}
              name={fieldName("planned_visit_status")}
              required
            >
              {plannedVisitStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor={fieldName("assigned_user_id")}
          >
            Assigned visitor
          </label>
          <select
            className={inputClassName()}
            defaultValue={visit?.assigned_user_id ?? defaultAssigneeId ?? ""}
            id={fieldName("assigned_user_id")}
            name={fieldName("assigned_user_id")}
            required
          >
            <option value="">Select visitor</option>
            {assignableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} · {labelForRole(user.role)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor={fieldName("crop_stage_timing")}
          >
            Crop stage / timing
          </label>
          <input
            className={inputClassName()}
            defaultValue={visit?.crop_stage_timing ?? ""}
            id={fieldName("crop_stage_timing")}
            name={fieldName("crop_stage_timing")}
            placeholder="Example: 30 DAS, flowering, harvest"
          />
        </div>
      </div>

      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor={fieldName("visit_purpose")}
        >
          Visit purpose
        </label>
        <textarea
          className={textareaClassName()}
          defaultValue={visit?.visit_purpose ?? ""}
          id={fieldName("visit_purpose")}
          name={fieldName("visit_purpose")}
          required
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">
          Parameters to Monitor
        </p>
        <div className="min-h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          {selectedParameters.length ? (
            <div className="flex flex-wrap gap-2">
              {selectedParameters.map((parameter) => (
                <span
                  className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm"
                  key={parameter}
                >
                  {displayVisitParameter(parameter)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No parameters selected yet.</p>
          )}
        </div>
        <details className="mt-2 rounded-md border border-slate-200 bg-white">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-brand-700">
            Choose parameters
          </summary>
          <div className="grid gap-2 border-t border-slate-200 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {visitParameterOptions.map((parameter) => (
              <label
                className="flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
                key={parameter}
              >
                <input
                  checked={selectedParameterSet.has(parameter)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  name={fieldName("parameters_to_collect")}
                  onChange={(event) =>
                    toggleParameter(parameter, event.target.checked)
                  }
                  type="checkbox"
                  value={parameter}
                />
                {displayVisitParameter(parameter)}
              </label>
            ))}
          </div>
        </details>
      </div>

      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor={fieldName("special_instructions")}
        >
          Special instructions
        </label>
        <textarea
          className={textareaClassName()}
          defaultValue={visit?.special_instructions ?? ""}
          id={fieldName("special_instructions")}
          name={fieldName("special_instructions")}
        />
      </div>

      {showSubmit ? (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          {cancelHref ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              href={cancelHref}
            >
              Cancel
            </Link>
          ) : null}
          <SubmitButton compact={compact} submitLabel={submitLabel} />
        </div>
      ) : null}
    </>
  );

  if (!showSubmit) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <form action={formAction} className="space-y-4" ref={formRef}>
      {content}
    </form>
  );
}
