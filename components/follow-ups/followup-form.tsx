"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { ArrowLeft, CheckCircle2, Save } from "lucide-react";
import {
  deviceWorkingStatusOptions,
  farmerSaleFollowupType,
  farmerSatisfactionOptions,
  fitmentInspectionStatusOptions,
  followupMethodOptions,
  followupOutcomeOptions,
  followupStatusOptions,
  followupTypeOptions,
  interestLevelOptions
} from "@/lib/follow-ups/options";
import type {
  Followup,
  FollowupContext,
  UserOption
} from "@/lib/follow-ups/types";
import { labelForRole } from "@/lib/users/options";

type FollowupFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  context?: FollowupContext;
  error?: string | null;
  followup: Followup;
  mode: "edit" | "complete";
  users: UserOption[];
};

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
}

function textAreaClassName() {
  return "min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function dateValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function SubmitButton({ label, mode }: { label: string; mode: "edit" | "complete" }) {
  const { pending } = useFormStatus();
  const Icon = mode === "complete" ? CheckCircle2 : Save;

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={pending}
      type="submit"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saving..." : label}
    </button>
  );
}

function SelectField({
  defaultValue,
  label,
  name,
  options,
  placeholder,
  required = false
}: {
  defaultValue?: string | null;
  label: string;
  name: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
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
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FollowupForm({
  action,
  cancelHref,
  context,
  error,
  followup,
  mode,
  users
}: FollowupFormProps) {
  const completingFarmerSale =
    mode === "complete" && followup.followup_type === farmerSaleFollowupType;

  return (
    <form action={action} className="space-y-6">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Post Installation Follow-up Details
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">
              Follow-up code
            </p>
            <p className="min-h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
              {followup.followup_code}
            </p>
          </div>

          {mode === "complete" ? (
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">
                Follow-up type
              </p>
              <p className="min-h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                {followup.followup_type}
              </p>
              <input
                name="followup_type"
                type="hidden"
                value={followup.followup_type}
              />
            </div>
          ) : (
            <SelectField
              defaultValue={followup.followup_type}
              label="Follow-up type"
              name="followup_type"
              options={followupTypeOptions}
              required
            />
          )}

          {mode === "complete" ? (
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">
                Follow-up status
              </p>
              <p className="min-h-10 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                Completed
              </p>
              <input name="followup_status" type="hidden" value="Completed" />
            </div>
          ) : (
            <SelectField
              defaultValue={followup.followup_status}
              label="Follow-up status"
              name="followup_status"
              options={followupStatusOptions}
              required
            />
          )}

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="followup_due_date"
            >
              Due date
            </label>
            <input
              className={inputClassName()}
              defaultValue={dateValue(followup.followup_due_date)}
              id="followup_due_date"
              name="followup_due_date"
              required
              type="date"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="followup_date"
            >
              Follow-up date
            </label>
            <input
              className={inputClassName()}
              defaultValue={dateValue(followup.followup_date)}
              id="followup_date"
              name="followup_date"
              type="date"
            />
          </div>

          <SelectField
            defaultValue={followup.followup_method}
            label="Follow-up method"
            name="followup_method"
            options={followupMethodOptions}
            required
          />

          <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              defaultChecked={followup.escalation_required}
              name="escalation_required"
              type="checkbox"
            />
            Escalation required
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Linked records
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Farmer</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {context?.farmerName ?? "Not set"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {context?.farmerMobile ?? "Mobile not set"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Farmer lead ID</p>
            <p className="mt-1 break-all text-sm font-semibold text-slate-950">
              {followup.farmer_lead_id ?? "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">
              Installation ID
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-slate-950">
              {followup.installation_id ?? "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Device ID</p>
            <p className="mt-1 break-all text-sm font-semibold text-slate-950">
              {followup.device_id ?? "Not set"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Follow-up observations
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="farmer_feedback"
            >
              Farmer feedback
            </label>
            <textarea
              className={textAreaClassName()}
              defaultValue={followup.farmer_feedback ?? ""}
              id="farmer_feedback"
              name="farmer_feedback"
              required={completingFarmerSale}
            />
          </div>

          <SelectField
            defaultValue={followup.farmer_satisfaction}
            label="Farmer satisfaction"
            name="farmer_satisfaction"
            options={farmerSatisfactionOptions}
            placeholder="Select satisfaction"
          />

          <SelectField
            defaultValue={followup.fitment_inspection_status}
            label="Fitment inspection status"
            name="fitment_inspection_status"
            options={fitmentInspectionStatusOptions}
            placeholder="Select fitment status"
            required={completingFarmerSale}
          />

          <SelectField
            defaultValue={followup.device_working_status}
            label="Device working status"
            name="device_working_status"
            options={deviceWorkingStatusOptions}
            placeholder="Select device status"
            required={completingFarmerSale}
          />

          <SelectField
            defaultValue={followup.repeat_purchase_interest}
            label="Repeat purchase interest"
            name="repeat_purchase_interest"
            options={interestLevelOptions}
            placeholder="Select interest"
          />

          <SelectField
            defaultValue={followup.referral_interest}
            label="Referral interest"
            name="referral_interest"
            options={interestLevelOptions}
            placeholder="Select interest"
          />

          <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              defaultChecked={followup.issue_observed}
              name="issue_observed"
              type="checkbox"
            />
            Issue observed
          </label>

          <div className="md:col-span-2">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="issue_details"
            >
              Issue details
            </label>
            <textarea
              className={textAreaClassName()}
              defaultValue={followup.issue_details ?? ""}
              id="issue_details"
              name="issue_details"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="gps_latitude"
            >
              GPS latitude
            </label>
            <input
              className={inputClassName()}
              defaultValue={followup.gps_latitude ?? ""}
              id="gps_latitude"
              name="gps_latitude"
              step="any"
              type="number"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="gps_longitude"
            >
              GPS longitude
            </label>
            <input
              className={inputClassName()}
              defaultValue={followup.gps_longitude ?? ""}
              id="gps_longitude"
              name="gps_longitude"
              step="any"
              type="number"
            />
          </div>

          <div className="md:col-span-2">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="irrigation_observation"
            >
              Irrigation observation
            </label>
            <textarea
              className={textAreaClassName()}
              defaultValue={followup.irrigation_observation ?? ""}
              id="irrigation_observation"
              name="irrigation_observation"
            />
          </div>

          <div className="md:col-span-2">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="crop_observation"
            >
              Crop observation
            </label>
            <textarea
              className={textAreaClassName()}
              defaultValue={followup.crop_observation ?? ""}
              id="crop_observation"
              name="crop_observation"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Summary and next action
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="followup_summary"
            >
              Follow-up summary
            </label>
            <textarea
              className={textAreaClassName()}
              defaultValue={followup.followup_summary ?? ""}
              id="followup_summary"
              name="followup_summary"
              required
            />
          </div>

          <SelectField
            defaultValue={followup.outcome}
            label="Outcome"
            name="outcome"
            options={followupOutcomeOptions}
            required
          />

          <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              defaultChecked={followup.next_action_required}
              name="next_action_required"
              type="checkbox"
            />
            Next action required
          </label>

          <div className="md:col-span-2">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="next_action"
            >
              Next action
            </label>
            <textarea
              className={textAreaClassName()}
              defaultValue={followup.next_action ?? ""}
              id="next_action"
              name="next_action"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="next_action_date"
            >
              Next action date
            </label>
            <input
              className={inputClassName()}
              defaultValue={dateValue(followup.next_action_date)}
              id="next_action_date"
              name="next_action_date"
              type="date"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="escalated_to_user_id"
            >
              Escalated to
            </label>
            <select
              className={inputClassName()}
              defaultValue={followup.escalated_to_user_id ?? ""}
              id="escalated_to_user_id"
              name="escalated_to_user_id"
            >
              <option value="">Not escalated</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} · {labelForRole(user.role)}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="escalation_reason"
            >
              Escalation reason
            </label>
            <textarea
              className={textAreaClassName()}
              defaultValue={followup.escalation_reason ?? ""}
              id="escalation_reason"
              name="escalation_reason"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Report links
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="report_link"
            >
              Visit report link
            </label>
            <input
              className={inputClassName()}
              defaultValue={followup.report_link ?? ""}
              id="report_link"
              name="report_link"
              required={completingFarmerSale}
              type="url"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="photo_folder_link"
            >
              Photo folder link
            </label>
            <input
              className={inputClassName()}
              defaultValue={followup.photo_folder_link ?? ""}
              id="photo_folder_link"
              name="photo_folder_link"
              type="url"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          href={cancelHref}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Cancel
        </Link>
        <SubmitButton
          label={
            mode === "complete"
              ? "Complete Post Installation Follow-up"
              : "Save Post Installation Follow-up"
          }
          mode={mode}
        />
      </div>
    </form>
  );
}
