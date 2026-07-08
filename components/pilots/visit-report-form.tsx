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

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
      disabled={pending}
      type="submit"
    >
      <Save className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saving..." : "Submit Visit Report"}
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
    <label className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
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

const legacyNarrativeFields: Array<{
  key: keyof VisitReport;
  label: string;
}> = [
  { key: "farmer_feedback", label: "Farmer feedback" },
  {
    key: "treatment_vs_control_summary",
    label: "Treatment vs control summary"
  },
  { key: "crop_observation_summary", label: "Crop observation summary" },
  { key: "issue_details", label: "Issue details" },
  { key: "recommendation", label: "Recommendation" },
  { key: "next_action", label: "Next action" },
  { key: "review_comments", label: "Review comments" }
];

function buildVisitReportNotes(report?: VisitReport) {
  if (!report) {
    return "";
  }

  const summary = report.report_summary?.trim() ?? "";
  const sections = [summary];

  legacyNarrativeFields.forEach(({ key, label }) => {
    const value = report[key];

    if (typeof value !== "string") {
      return;
    }

    const trimmedValue = value.trim();

    if (!trimmedValue || summary.includes(trimmedValue)) {
      return;
    }

    sections.push(`${label}:\n${trimmedValue}`);
  });

  return sections.filter(Boolean).join("\n\n");
}

function buildReportTitle({
  pilot,
  report,
  reportType,
  selectedPlannedVisit
}: {
  pilot: Pilot;
  report?: VisitReport;
  reportType: string;
  selectedPlannedVisit?: PlannedPilotVisit;
}) {
  if (report?.report_title) {
    return report.report_title;
  }

  if (selectedPlannedVisit) {
    return `Visit ${selectedPlannedVisit.visit_number} Report`;
  }

  return `${pilot.pilot_name} - ${reportType}`;
}

export function VisitReportForm({
  action,
  cancelHref,
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
  const [reportType, setReportType] = useState(
    report?.report_type ?? defaultReportType
  );
  const canApproveFinalPilotReport = hasAnyRole(currentUser, [
    "R&D Head",
    "Admin"
  ]);
  const isResearchAssistant = currentUser.role === "Research Assistant";
  const canApprovePartnerSharing = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "R&D Head"
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
  const generatedReportTitle = buildReportTitle({
    pilot,
    report,
    reportType,
    selectedPlannedVisit
  });
  const showReviewApproval =
    reportType === "Final Pilot Report" ||
    report?.report_type === "Final Pilot Report" ||
    report?.report_status === "Approved";

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
      <input name="report_title" type="hidden" value={generatedReportTitle} />
      <input name="report_link" type="hidden" value={report?.report_link ?? ""} />
      {legacyNarrativeFields.map(({ key }) => (
        <input
          key={key}
          name={key}
          type="hidden"
          value={typeof report?.[key] === "string" ? report[key] : ""}
        />
      ))}

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
            id="report_type"
            name="report_type"
            onChange={(event) => setReportType(event.target.value)}
            required
            value={reportType}
          >
            {reportTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {isResearchAssistant ? (
          <div>
            <p className="mb-1.5 block text-sm font-medium text-slate-700">
              Submitted by
            </p>
            <input name="submitted_by_user_id" type="hidden" value={currentUser.id} />
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              {currentUser.full_name} · Research Assistant
            </div>
          </div>
        ) : (
          <UserSelect
            defaultValue={report?.submitted_by_user_id ?? currentUser.id}
            label="Submitted by"
            name="submitted_by_user_id"
            options={submittedByUsers}
            required
          />
        )}
        {showReviewApproval ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-sm font-medium text-slate-700">
              R&D approval
            </p>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              {reviewer
                ? `Reviewed by ${reviewer.full_name} · ${labelForRole(reviewer.role)}`
                : canApproveFinalPilotReport
                  ? `Final approval will be stamped as ${currentUser.full_name} · ${labelForRole(currentUser.role)}.`
                  : "Only the R&D Head can approve final pilot reports."}
            </p>
          </div>
        ) : null}
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
          <div className="grid gap-4 lg:grid-cols-2">
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

      <div>
        <TextareaField
          defaultValue={buildVisitReportNotes(report)}
          label="Visit Report Notes"
          name="report_summary"
          required
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-950">
            Evidence Uploads
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Add photos or a data sheet when the visit has supporting evidence.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FileUploadField
            currentValue={report?.photo_folder_link}
            helperText="Upload one visit photo. Existing ZIP links remain saved."
            kind="image"
            label="Report photos"
            name="photo_folder_link"
          />
          <FileUploadField
            currentValue={report?.data_sheet_link}
            kind="sheet"
            label="Report data sheet"
            name="data_sheet_link"
          />
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <CheckboxField
          defaultChecked={report?.issue_observed}
          label="Issue observed"
          name="issue_observed"
        />
        {!canApprovePartnerSharing && report?.approved_for_partner_sharing ? (
          <input
            name="approved_for_partner_sharing"
            type="hidden"
            value="true"
          />
        ) : null}
        {canApprovePartnerSharing ? (
          <CheckboxField
            defaultChecked={report?.approved_for_partner_sharing}
            label="Approved for partner sharing"
            name="approved_for_partner_sharing"
          />
        ) : null}
        {canApproveFinalPilotReport ? (
          <CheckboxField
            defaultChecked={pilot.scale_up_recommended}
            label="Recommend scale-up on pilot"
            name="scale_up_recommended_update"
          />
        ) : null}
      </div>

      {canApproveFinalPilotReport && reportType === "Final Pilot Report" ? (
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
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
            href={cancelHref}
          >
            Cancel
          </Link>
        ) : null}
        <SubmitButton />
      </div>
    </form>
  );
}
