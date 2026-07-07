"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Save } from "lucide-react";
import { CustomCropFields } from "@/components/crops/custom-crop-fields";
import { CropSelect } from "@/components/crops/crop-select";
import { StateDistrictSelect } from "@/src/components/location/StateDistrictSelect";
import { FileUploadField } from "@/components/uploads/file-upload-field";
import {
  UserSearchSelect,
  type UserSearchOption
} from "@/components/users/user-search-select";
import {
  cropStageOptions,
  defaultFunnelStage,
  defaultIrrigationType,
  defaultLeadSource,
  defaultLeadType,
  defaultPrimaryCrop,
  funnelStageOptions,
  irrigationTypeOptions,
  leadSourceOptions
} from "@/lib/farmer-leads/options";
import type { FarmerLead } from "@/lib/farmer-leads/types";
import { deriveLeadStatus } from "@/lib/farmer-leads/workflow";
import { hasAnyRole } from "@/lib/users/permissions";

type FarmerLeadFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  canConfirmPayment?: boolean;
  error?: string | null;
  includeOwnerFields?: boolean;
  lead?: FarmerLead;
  mode: "create" | "edit";
  users?: UserSearchOption[];
};

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function textAreaClassName() {
  return "min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={pending}
      type="submit"
    >
      <Save className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saving..." : label}
    </button>
  );
}

function dateValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function defaultDateValue(value?: string | null) {
  return dateValue(value) || new Date().toISOString().slice(0, 10);
}

const manualFunnelStageOptions = funnelStageOptions.filter(
  (option) => option.value !== "Device Installed"
);

export function FarmerLeadForm({
  action,
  cancelHref,
  canConfirmPayment = false,
  error,
  includeOwnerFields = false,
  lead,
  mode,
  users = []
}: FarmerLeadFormProps) {
  const isWorkflowInstalledLead = Boolean(lead?.installation_completed);
  const hasInconsistentDeviceInstalledStage =
    lead?.funnel_stage === "Device Installed" && !lead.installation_completed;
  const initialFunnelStage = isWorkflowInstalledLead
    ? "Device Installed"
    : hasInconsistentDeviceInstalledStage
      ? ""
      : (lead?.funnel_stage ?? defaultFunnelStage);
  const [primaryCrop, setPrimaryCrop] = useState(
    lead?.primary_crop ?? defaultPrimaryCrop
  );
  const [stateValue, setStateValue] = useState(lead?.state ?? "");
  const [districtValue, setDistrictValue] = useState(lead?.district ?? "");
  const [funnelStage, setFunnelStage] = useState(initialFunnelStage);
  const [paymentConfirmed, setPaymentConfirmed] = useState(
    Boolean(lead?.payment_confirmed)
  );
  const calculatedLeadStatus = deriveLeadStatus({
    funnelStage,
    paymentConfirmed
  });
  const ownerUsers = users.filter((user) =>
    hasAnyRole(user, ["Sales Head", "RSM", "Salesperson", "Admin"])
  );
  const rsmUsers = users.filter((user) =>
    hasAnyRole(user, ["RSM", "Sales Head", "Admin"])
  );

  return (
    <form action={action} className="space-y-6">
      <input
        name="lead_type"
        type="hidden"
        value={defaultLeadType}
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">Lead details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="lead_code"
            >
              Lead code
            </label>
            <input
              className={inputClassName()}
              defaultValue={lead?.lead_code ?? ""}
              id="lead_code"
              name="lead_code"
              placeholder={mode === "create" ? "Auto-generated if blank" : ""}
              type="text"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="farmer_name"
            >
              Farmer name
            </label>
            <input
              className={inputClassName()}
              defaultValue={lead?.farmer_name ?? ""}
              id="farmer_name"
              name="farmer_name"
              placeholder="Farmer full name"
              required
              type="text"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="mobile_number"
            >
              Mobile number
            </label>
            <input
              className={inputClassName()}
              defaultValue={lead?.mobile_number ?? ""}
              id="mobile_number"
              name="mobile_number"
              placeholder="10-digit mobile"
              required
              type="tel"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="village"
            >
              Village
            </label>
            <input
              className={inputClassName()}
              defaultValue={lead?.village ?? ""}
              id="village"
              name="village"
              placeholder="Village"
              required
              type="text"
            />
          </div>

          <StateDistrictSelect
            districtValue={districtValue}
            onDistrictChange={setDistrictValue}
            onStateChange={setStateValue}
            required
            stateValue={stateValue}
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Status and crop
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1.5 block text-sm font-medium text-slate-700">
              Lead status
            </p>
            <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
              {calculatedLeadStatus}
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Calculated from funnel stage and payment confirmation.
            </p>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor={
                isWorkflowInstalledLead ? "funnel_stage_readonly" : "funnel_stage"
              }
            >
              Funnel stage
            </label>
            {isWorkflowInstalledLead ? (
              <>
                <input name="funnel_stage" type="hidden" value="Device Installed" />
                <div
                  className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700"
                  id="funnel_stage_readonly"
                >
                  Device Installed
                </div>
              </>
            ) : (
              <select
                className={inputClassName()}
                id="funnel_stage"
                name="funnel_stage"
                onChange={(event) => setFunnelStage(event.target.value)}
                required
                value={funnelStage}
              >
                <option disabled value="">
                  Select funnel stage
                </option>
                {manualFunnelStageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Device Installed is set automatically after a farmer-sale
              installation is completed.
            </p>
            {hasInconsistentDeviceInstalledStage ? (
              <p className="mt-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                This lead was manually marked Device Installed. Choose the
                correct current stage before saving.
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="lead_source"
            >
              Lead source
            </label>
            <select
              className={inputClassName()}
              defaultValue={lead?.lead_source ?? defaultLeadSource}
              id="lead_source"
              name="lead_source"
            >
              {leadSourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <CropSelect
              label="Primary crop"
              name="primary_crop"
              onChange={setPrimaryCrop}
              required
              value={primaryCrop}
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="irrigation_type"
            >
              Irrigation type
            </label>
            <select
              className={inputClassName()}
              defaultValue={lead?.irrigation_type ?? defaultIrrigationType}
              id="irrigation_type"
              name="irrigation_type"
              required
            >
              {irrigationTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="crop_stage"
            >
              Crop stage
            </label>
            <select
              className={inputClassName()}
              defaultValue={lead?.crop_stage ?? ""}
              id="crop_stage"
              name="crop_stage"
            >
              <option value="">Select crop stage</option>
              {cropStageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="crop_area_acres"
            >
              Crop area acres
            </label>
            <input
              className={inputClassName()}
              defaultValue={lead?.crop_area_acres ?? ""}
              id="crop_area_acres"
              min={0}
              name="crop_area_acres"
              step="0.01"
              type="number"
            />
          </div>

          {primaryCrop === "Other" ? (
            <CustomCropFields
              defaultValue={lead?.other_primary_crop}
              name="other_primary_crop"
              required
            />
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Follow-up and progress
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="next_action_date"
            >
              Next action date
            </label>
            <input
              className={inputClassName()}
              defaultValue={defaultDateValue(
                lead?.next_action_date ?? lead?.followup_due_date
              )}
              id="next_action_date"
              name="next_action_date"
              required
              type="date"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3 md:col-span-2">
            <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              <input
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                checked={paymentConfirmed}
                disabled={!canConfirmPayment}
                name="payment_confirmed"
                onChange={(event) => setPaymentConfirmed(event.target.checked)}
                type="checkbox"
              />
              Payment confirmed
            </label>
            <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              <input
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                checked={Boolean(lead?.device_dispatched)}
                readOnly
                type="checkbox"
              />
              Device dispatched
            </label>
            <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              <input
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                checked={Boolean(lead?.installation_completed)}
                readOnly
                type="checkbox"
              />
              Device installed
            </label>
            {!canConfirmPayment ? (
              <p className="text-xs leading-5 text-slate-500 sm:col-span-3">
                Payment can be confirmed only by Accounts or Admin. Dispatch and
                installation progress is updated from those workflows.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {includeOwnerFields ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-slate-950">
            Assignment
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Owner assignment is for Salesperson or RSM users when role rules are
            active.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <UserSearchSelect
              defaultValue={lead?.owner_user_id}
              label="Owner user"
              name="owner_user_id"
              placeholder="Search owner by name or email"
              users={ownerUsers}
            />
            <UserSearchSelect
              defaultValue={lead?.rsm_user_id}
              label="RSM"
              name="rsm_user_id"
              placeholder="Search RSM by name or email"
              users={rsmUsers}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          New leads are assigned to the right RSM or Salesperson automatically.
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Farmer documents and photos
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FileUploadField
            currentValue={lead?.lead_photo_folder_link}
            kind="zip"
            label="Lead photos ZIP"
            name="lead_photo_folder_link"
          />
          <FileUploadField
            currentValue={lead?.farmer_document_link}
            kind="document"
            label="Farmer document file"
            name="farmer_document_link"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor="remarks"
        >
          Remarks
        </label>
        <textarea
          className={textAreaClassName()}
          defaultValue={lead?.remarks ?? ""}
          id="remarks"
          name="remarks"
          placeholder="Field notes, context, or next action"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          href={cancelHref}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Cancel
        </Link>
        <SubmitButton label={mode === "create" ? "Create lead" : "Save lead"} />
      </div>
    </form>
  );
}
