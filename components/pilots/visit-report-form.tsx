"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import { CustomCropFields } from "@/components/crops/custom-crop-fields";
import { CropSelect } from "@/components/crops/crop-select";
import { FileUploadField } from "@/components/uploads/file-upload-field";
import { todayDate } from "@/lib/pilots/form-data";
import {
  defaultReportStatus,
  defaultReportType,
  fitmentInspectionStatusOptions,
  pilotResultStatusOptions,
  reportStatusOptions,
  reportTypeOptions
} from "@/lib/pilots/options";
import { parameterInputName } from "@/lib/pilots/visit-planning";
import { labelForRole } from "@/lib/users/options";
import { hasAnyRole } from "@/lib/users/permissions";
import type {
  Pilot,
  PilotVisit,
  PlannedPilotVisit,
  UserOption,
  VisitReport
} from "@/lib/pilots/types";

type VisitReportFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
  compact?: boolean;
  defaultPlannedVisitId?: string | null;
  defaultPilotVisitId?: string | null;
  currentUser: UserOption;
  pilot: Pilot;
  plannedVisits?: PlannedPilotVisit[];
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
  defaultPlannedVisitId,
  defaultPilotVisitId,
  pilot,
  plannedVisits = [],
  report,
  users,
  visits
}: VisitReportFormProps) {
  const [crop, setCrop] = useState(report?.crop ?? pilot.crop ?? "");
  const [selectedPlannedVisitId, setSelectedPlannedVisitId] = useState(
    report?.planned_pilot_visit_id ?? defaultPlannedVisitId ?? ""
  );
  const canApproveFinalPilotReport = hasAnyRole(currentUser, [
    "R&D Head",
    "Admin"
  ]);
  const selectedPlannedVisit = plannedVisits.find(
    (visit) => visit.id === selectedPlannedVisitId
  );
  const parameterObservations =
    report?.parameter_observations &&
    typeof report.parameter_observations === "object" &&
    !Array.isArray(report.parameter_observations)
      ? (report.parameter_observations as Record<string, string>)
      : {};
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
          defaultValue={report?.submitted_by_user_id ?? currentUser.id}
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
            htmlFor="planned_pilot_visit_id"
          >
            Planned visit
          </label>
          <select
            className={inputClassName()}
            defaultValue={selectedPlannedVisitId}
            id="planned_pilot_visit_id"
            name="planned_pilot_visit_id"
            onChange={(event) => setSelectedPlannedVisitId(event.target.value)}
          >
            <option value="">No linked planned visit</option>
            {plannedVisits.map((visit) => (
              <option key={visit.id} value={visit.id}>
                Visit {visit.visit_number} · {visit.planned_visit_date} ·{" "}
                {visit.visit_type}
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
        <CropSelect label="Crop" name="crop" onChange={setCrop} value={crop} />
        {crop === "Other" ? (
          <CustomCropFields
            defaultValue={report?.other_crop ?? pilot.other_crop}
            name="other_crop"
            required
          />
        ) : (
          <input
            name="other_crop"
            type="hidden"
            value={report?.other_crop ?? pilot.other_crop ?? ""}
          />
        )}
        <Field
          defaultValue={report?.report_title}
          label="Report title"
          name="report_title"
          required
        />
        <FileUploadField
          currentValue={report?.report_link}
          kind="document"
          label="Report file"
          name="report_link"
          required
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
        <FileUploadField
          currentValue={report?.photo_folder_link}
          kind="zip"
          label="Report photos ZIP"
          name="photo_folder_link"
        />
        <FileUploadField
          currentValue={report?.data_sheet_link}
          kind="sheet"
          label="Report data sheet"
          name="data_sheet_link"
        />
      </div>

      {selectedPlannedVisit?.parameters_to_collect.length ? (
        <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-950">
              Planned visit parameters
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Enter the observations collected during this assigned visit.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {selectedPlannedVisit.parameters_to_collect.map((parameter) => (
              <TextareaField
                defaultValue={parameterObservations[parameter]}
                key={parameter}
                label={parameter}
                name={parameterInputName(parameter)}
              />
            ))}
          </div>
          {selectedPlannedVisit.special_instructions ? (
            <p className="mt-3 rounded-md border border-brand-100 bg-white px-3 py-2 text-sm text-slate-700">
              <span className="font-semibold">Instructions:</span>{" "}
              {selectedPlannedVisit.special_instructions}
            </p>
          ) : null}
        </div>
      ) : null}

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
