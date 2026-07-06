"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import { todayDate } from "@/lib/pilots/form-data";
import {
  cropOptions,
  defaultReportStatus,
  defaultReportType,
  fitmentInspectionStatusOptions,
  pilotResultStatusOptions,
  reportStatusOptions,
  reportTypeOptions
} from "@/lib/pilots/options";
import { labelForRole } from "@/lib/users/options";
import { hasAnyRole } from "@/lib/users/permissions";
import type {
  Pilot,
  PilotVisit,
  UserOption,
  VisitReport
} from "@/lib/pilots/types";

type VisitReportFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
  compact?: boolean;
  defaultPilotVisitId?: string | null;
  currentUser: UserOption;
  pilot: Pilot;
  report?: VisitReport;
  users: UserOption[];
  visits: PilotVisit[];
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
      <Save className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saving..." : compact ? "Add report" : "Save report"}
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
  defaultValue?: string | null;
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

export function VisitReportForm({
  action,
  cancelHref,
  compact = false,
  currentUser,
  defaultPilotVisitId,
  pilot,
  report,
  users,
  visits
}: VisitReportFormProps) {
  const canApproveFinalPilotReport = hasAnyRole(currentUser, [
    "R&D Head",
    "Admin"
  ]);
  const reviewer = report?.reviewed_by_user_id && report.report_status === "Approved"
    ? users.find((user) => user.id === report.reviewed_by_user_id)
    : null;
  const visibleReportStatusOptions = reportStatusOptions.filter(
    (option) =>
      canApproveFinalPilotReport ||
      option.value !== "Approved" ||
      report?.report_status === "Approved"
  );
  const submittedByUsers = users.filter((user) =>
    hasAnyRole(user, [
      "Management",
      "Agronomist",
      "Research Assistant",
      "R&D Head",
      "Admin"
    ])
  );

  return (
    <form action={action} className="space-y-4">
      <input name="pilot_id" type="hidden" value={pilot.id} />
      <input name="institution_id" type="hidden" value={pilot.institution_id ?? ""} />
      <input name="farmer_lead_id" type="hidden" value={pilot.farmer_lead_id} />
      <input name="installation_id" type="hidden" value={pilot.installation_id ?? ""} />
      <input
        name="reviewed_by_user_id"
        type="hidden"
        value={report?.reviewed_by_user_id ?? ""}
      />
      <input
        name="reviewed_date"
        type="hidden"
        value={report?.reviewed_date ?? ""}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          defaultValue={report?.report_date ?? todayDate()}
          label="Report date"
          name="report_date"
          required
          type="date"
        />
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor="report_type"
          >
            Report type
          </label>
          <select
            className={inputClassName()}
            defaultValue={report?.report_type ?? defaultReportType}
            id="report_type"
            name="report_type"
            required
          >
            {reportTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <UserSelect
          defaultValue={report?.submitted_by_user_id}
          label="Submitted by"
          name="submitted_by_user_id"
          options={submittedByUsers}
          required
        />
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-sm font-medium text-slate-700">Review approval</p>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            {reviewer
              ? `Reviewed by ${reviewer.full_name} · ${labelForRole(reviewer.role)}`
              : canApproveFinalPilotReport
                ? `Final approval will be stamped as ${currentUser.full_name} · ${labelForRole(currentUser.role)}.`
                : "Only the R&D Head can approve final pilot reports."}
          </p>
        </div>
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor="report_status"
          >
            Report status
          </label>
          <select
            className={inputClassName()}
            defaultValue={report?.report_status ?? defaultReportStatus}
            id="report_status"
            name="report_status"
            required
          >
            {visibleReportStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor="pilot_visit_id"
          >
            Pilot visit
          </label>
          <select
            className={inputClassName()}
            defaultValue={report?.pilot_visit_id ?? defaultPilotVisitId ?? ""}
            id="pilot_visit_id"
            name="pilot_visit_id"
          >
            <option value="">No linked visit</option>
            {visits.map((visit) => (
              <option key={visit.id} value={visit.id}>
                {visit.visit_code} · {visit.visit_date}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor="crop"
          >
            Crop
          </label>
          <select
            className={inputClassName()}
            defaultValue={report?.crop ?? pilot.crop}
            id="crop"
            name="crop"
          >
            <option value="">Select crop</option>
            {cropOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Field
          defaultValue={report?.other_crop ?? pilot.other_crop}
          label="Other crop"
          name="other_crop"
        />
        <Field
          defaultValue={report?.report_title}
          label="Report title"
          name="report_title"
          required
        />
        <Field
          defaultValue={report?.report_link}
          label="Report link"
          name="report_link"
          required
          type="url"
        />
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor="fitment_inspection_status"
          >
            Fitment inspection status
          </label>
          <select
            className={inputClassName()}
            defaultValue={report?.fitment_inspection_status ?? ""}
            id="fitment_inspection_status"
            name="fitment_inspection_status"
          >
            <option value="">Select fitment status</option>
            {fitmentInspectionStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Field
          defaultValue={report?.next_visit_date}
          label="Next visit date"
          name="next_visit_date"
          type="date"
        />
        <Field
          defaultValue={report?.photo_folder_link}
          label="Photo folder link"
          name="photo_folder_link"
          type="url"
        />
        <Field
          defaultValue={report?.data_sheet_link}
          label="Data sheet link"
          name="data_sheet_link"
          type="url"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextareaField
          defaultValue={report?.report_summary}
          label="Report summary"
          name="report_summary"
          required
        />
        <TextareaField
          defaultValue={report?.farmer_feedback}
          label="Farmer feedback"
          name="farmer_feedback"
        />
        <TextareaField
          defaultValue={report?.treatment_vs_control_summary}
          label="Treatment vs control summary"
          name="treatment_vs_control_summary"
        />
        <TextareaField
          defaultValue={report?.crop_observation_summary}
          label="Crop observation summary"
          name="crop_observation_summary"
        />
        <TextareaField
          defaultValue={report?.issue_details}
          label="Issue details"
          name="issue_details"
        />
        <TextareaField
          defaultValue={report?.recommendation}
          label="Recommendation"
          name="recommendation"
        />
        <TextareaField
          defaultValue={report?.next_action}
          label="Next action"
          name="next_action"
        />
        <TextareaField
          defaultValue={report?.review_comments}
          label="Review comments"
          name="review_comments"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <CheckboxField
          defaultChecked={report?.issue_observed}
          label="Issue observed"
          name="issue_observed"
        />
        <CheckboxField
          defaultChecked={report?.approved_for_partner_sharing}
          label="Approved for partner sharing"
          name="approved_for_partner_sharing"
        />
        {canApproveFinalPilotReport ? (
          <CheckboxField
            defaultChecked={pilot.scale_up_recommended}
            label="Recommend scale-up on pilot"
            name="scale_up_recommended_update"
          />
        ) : null}
      </div>

      {canApproveFinalPilotReport ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor="pilot_result_status_update"
          >
            Pilot result update when approving final report
          </label>
          <select
            className={inputClassName()}
            defaultValue=""
            id="pilot_result_status_update"
            name="pilot_result_status_update"
          >
            <option value="">Keep current result status</option>
            {pilotResultStatusOptions
              .filter((option) =>
                ["Successful", "Failed", "Inconclusive"].includes(option.value)
              )
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </div>
      ) : null}

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
