"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import { todayDate } from "@/lib/pilots/form-data";
import {
  defaultVisitStatus,
  defaultVisitType,
  visitStatusOptions,
  visitTypeOptions
} from "@/lib/pilots/options";
import { labelForRole } from "@/lib/users/options";
import { hasRole } from "@/lib/users/permissions";
import type { PilotVisit, UserOption, VisitReport } from "@/lib/pilots/types";

type PilotVisitFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
  compact?: boolean;
  reports: VisitReport[];
  users: UserOption[];
  visit?: PilotVisit;
};

const visitUserRoles = new Set(["Agronomist", "Research Assistant", "R&D Head"]);

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
      <Save className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saving..." : compact ? "Add visit" : "Save visit"}
    </button>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required = false,
  type = "text"
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-medium text-slate-700"
        htmlFor={name}
      >
        {label}
      </label>
      <input
        className={inputClassName()}
        defaultValue={defaultValue ?? ""}
        id={name}
        min={type === "number" ? 0 : undefined}
        name={name}
        required={required}
        type={type}
      />
    </div>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  required = false
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-medium text-slate-700"
        htmlFor={name}
      >
        {label}
      </label>
      <textarea
        className={textareaClassName()}
        defaultValue={defaultValue ?? ""}
        id={name}
        name={name}
        required={required}
      />
    </div>
  );
}

function UserSelect({
  defaultValue,
  label,
  name,
  options,
  required = false
}: {
  defaultValue?: string | null;
  label: string;
  name: string;
  options: UserOption[];
  required?: boolean;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-medium text-slate-700"
        htmlFor={name}
      >
        {label}
      </label>
      <select
        className={inputClassName()}
        defaultValue={defaultValue ?? ""}
        id={name}
        name={name}
        required={required}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((user) => (
          <option key={user.id} value={user.id}>
            {user.full_name} · {labelForRole(user.role)}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({
  defaultChecked,
  label,
  name
}: {
  defaultChecked?: boolean | null;
  label: string;
  name: string;
}) {
  return (
    <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700">
      <input
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        defaultChecked={Boolean(defaultChecked)}
        name={name}
        type="checkbox"
      />
      {label}
    </label>
  );
}

export function PilotVisitForm({
  action,
  cancelHref,
  compact = false,
  reports,
  users,
  visit
}: PilotVisitFormProps) {
  const visitUsers = users.filter((user) =>
    Array.from(visitUserRoles).some((role) => hasRole(user, role))
  );
  const rdHeads = users.filter((user) => hasRole(user, "R&D Head"));
  const measurementFields = [
    ["treatment_soil_moisture_reading", "Treatment soil moisture"],
    ["control_soil_moisture_reading", "Control soil moisture"],
    ["treatment_plant_height_cm", "Treatment plant height cm"],
    ["control_plant_height_cm", "Control plant height cm"],
    ["treatment_chlorophyll_reading", "Treatment chlorophyll"],
    ["control_chlorophyll_reading", "Control chlorophyll"],
    ["treatment_yield_kg", "Treatment yield kg"],
    ["control_yield_kg", "Control yield kg"]
  ] as const;

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          defaultValue={visit?.visit_date ?? todayDate()}
          label="Visit date"
          name="visit_date"
          required
          type="date"
        />
        <Field
          defaultValue={visit?.visit_number}
          label="Visit number"
          name="visit_number"
          type="number"
        />
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor="visit_type"
          >
            Visit type
          </label>
          <select
            className={inputClassName()}
            defaultValue={visit?.visit_type ?? defaultVisitType}
            id="visit_type"
            name="visit_type"
            required
          >
            {visitTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor="visit_status"
          >
            Visit status
          </label>
          <select
            className={inputClassName()}
            defaultValue={visit?.visit_status ?? defaultVisitStatus}
            id="visit_status"
            name="visit_status"
            required
          >
            {visitStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <UserSelect
          defaultValue={visit?.visited_by_user_id}
          label="Visited by"
          name="visited_by_user_id"
          options={visitUsers}
          required
        />
        <UserSelect
          defaultValue={visit?.accompanied_by_user_id}
          label="Accompanied by"
          name="accompanied_by_user_id"
          options={visitUsers}
        />
        <UserSelect
          defaultValue={visit?.rd_head_user_id}
          label="R&D Head"
          name="rd_head_user_id"
          options={rdHeads}
        />
        <Field
          defaultValue={visit?.gps_latitude}
          label="GPS latitude"
          name="gps_latitude"
          type="number"
        />
        <Field
          defaultValue={visit?.gps_longitude}
          label="GPS longitude"
          name="gps_longitude"
          type="number"
        />
        <Field
          defaultValue={visit?.photo_folder_link}
          label="Photo folder link"
          name="photo_folder_link"
          type="url"
        />
        <Field
          defaultValue={visit?.raw_data_sheet_link}
          label="Raw data sheet link"
          name="raw_data_sheet_link"
          type="url"
        />
        <Field
          defaultValue={visit?.next_visit_date}
          label="Next visit date"
          name="next_visit_date"
          type="date"
        />
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor="visit_report_id"
          >
            Linked visit report
          </label>
          <select
            className={inputClassName()}
            defaultValue={visit?.visit_report_id ?? ""}
            id="visit_report_id"
            name="visit_report_id"
          >
            <option value="">No linked report</option>
            {reports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.visit_report_code} · {report.report_title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextareaField
          defaultValue={visit?.farmer_feedback}
          label="Farmer feedback"
          name="farmer_feedback"
        />
        <TextareaField
          defaultValue={visit?.treatment_plot_observation}
          label="Treatment plot observation"
          name="treatment_plot_observation"
        />
        <TextareaField
          defaultValue={visit?.control_plot_observation}
          label="Control plot observation"
          name="control_plot_observation"
        />
        <TextareaField
          defaultValue={visit?.irrigation_observation}
          label="Irrigation observation"
          name="irrigation_observation"
        />
        <TextareaField
          defaultValue={visit?.soil_moisture_observation}
          label="Soil moisture observation"
          name="soil_moisture_observation"
        />
        <TextareaField
          defaultValue={visit?.crop_growth_observation}
          label="Crop growth observation"
          name="crop_growth_observation"
        />
        <TextareaField
          defaultValue={visit?.pest_disease_observation}
          label="Pest disease observation"
          name="pest_disease_observation"
        />
        <TextareaField
          defaultValue={visit?.fertilizer_observation}
          label="Fertilizer observation"
          name="fertilizer_observation"
        />
        <TextareaField
          defaultValue={visit?.root_observation}
          label="Root observation"
          name="root_observation"
        />
        <TextareaField
          defaultValue={visit?.chlorophyll_observation}
          label="Chlorophyll observation"
          name="chlorophyll_observation"
        />
        <TextareaField
          defaultValue={visit?.yield_observation}
          label="Yield observation"
          name="yield_observation"
        />
        <TextareaField
          defaultValue={visit?.quality_observation}
          label="Quality observation"
          name="quality_observation"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {measurementFields.map(([name, label]) => (
          <Field
            defaultValue={visit?.[name]}
            key={name}
            label={label}
            name={name}
            type="number"
          />
        ))}
      </div>

      <TextareaField
        defaultValue={visit?.visit_summary}
        label="Visit summary"
        name="visit_summary"
        required
      />
      <TextareaField
        defaultValue={visit?.issue_details}
        label="Issue details"
        name="issue_details"
      />
      <TextareaField
        defaultValue={visit?.next_action}
        label="Next action"
        name="next_action"
      />

      <div className="grid gap-2 sm:grid-cols-3">
        <CheckboxField
          defaultChecked={visit?.issue_observed}
          label="Issue observed"
          name="issue_observed"
        />
        <CheckboxField
          defaultChecked={visit?.action_required}
          label="Action required"
          name="action_required"
        />
        <CheckboxField
          defaultChecked={visit?.visit_report_required ?? true}
          label="Visit report required"
          name="visit_report_required"
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
