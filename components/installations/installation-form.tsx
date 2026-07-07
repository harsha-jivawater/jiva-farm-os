"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Save } from "lucide-react";
import { StateDistrictSelect } from "@/src/components/location/StateDistrictSelect";
import { FileUploadField } from "@/components/uploads/file-upload-field";
import { holderTypeOptions } from "@/lib/devices/options";
import {
  defaultFarmerConfirmation,
  defaultFitmentStatus,
  defaultInstallationStatus,
  farmerConfirmationOptions,
  fitmentStatusOptions,
  installationMethodOptions,
  installationStatusOptions,
  installationTypeOptions,
  irrigationLineTypeOptions
} from "@/lib/installations/options";
import { addDays } from "@/lib/installations/form-data";
import type {
  Installation,
  InstallationDeviceOption,
  InstallationDispatchOption,
  InstallationFarmerLeadOption
} from "@/lib/installations/types";

type InstallationFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  devices: InstallationDeviceOption[];
  dispatches: InstallationDispatchOption[];
  error?: string | null;
  farmerLeads: InstallationFarmerLeadOption[];
  installation?: Installation;
  mode: "create" | "edit";
};

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
}

function textAreaClassName() {
  return "min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function dateValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function farmerLabel(farmerLead: InstallationFarmerLeadOption) {
  return `${farmerLead.lead_code} · ${farmerLead.farmer_name} · ${farmerLead.mobile_number}`;
}

function deviceLabel(device: InstallationDeviceOption) {
  const code = device.device_code ? ` · ${device.device_code}` : "";
  return `${device.serial_number}${code} · ${device.product_model} · ${device.device_status}`;
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

export function InstallationForm({
  action,
  cancelHref,
  devices,
  dispatches,
  error,
  farmerLeads,
  installation,
  mode
}: InstallationFormProps) {
  const initialFarmer = useMemo(
    () =>
      farmerLeads.find((lead) => lead.id === installation?.farmer_lead_id),
    [farmerLeads, installation?.farmer_lead_id]
  );
  const initialDevice = useMemo(
    () => devices.find((device) => device.id === installation?.device_id),
    [devices, installation?.device_id]
  );
  const initialDate = dateValue(installation?.installation_date) || todayDate();
  const [selectedFarmerLeadId, setSelectedFarmerLeadId] = useState(
    installation?.farmer_lead_id ?? initialFarmer?.id ?? ""
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState(
    installation?.device_id ?? initialDevice?.id ?? ""
  );
  const [selectedDispatchId, setSelectedDispatchId] = useState(
    installation?.dispatch_id ?? ""
  );
  const [farmerName, setFarmerName] = useState(
    installation?.farmer_name_snapshot ?? initialFarmer?.farmer_name ?? ""
  );
  const [farmerMobile, setFarmerMobile] = useState(
    installation?.farmer_mobile_snapshot ?? initialFarmer?.mobile_number ?? ""
  );
  const [stateValue, setStateValue] = useState(
    installation?.state ?? initialFarmer?.state ?? ""
  );
  const [districtValue, setDistrictValue] = useState(
    installation?.district ?? initialFarmer?.district ?? ""
  );
  const [taluk, setTaluk] = useState(
    installation?.taluk ?? initialFarmer?.taluk ?? ""
  );
  const [village, setVillage] = useState(
    installation?.village ?? initialFarmer?.village ?? ""
  );
  const [address, setAddress] = useState(
    installation?.installation_address ?? initialFarmer?.full_address ?? ""
  );
  const [rsmUserId, setRsmUserId] = useState(
    installation?.rsm_user_id ?? initialFarmer?.rsm_user_id ?? ""
  );
  const [regionId, setRegionId] = useState(
    installation?.region_id ?? initialFarmer?.region_id ?? ""
  );
  const [followupOwnerUserId, setFollowupOwnerUserId] = useState(
    installation?.followup_owner_user_id ?? initialFarmer?.owner_user_id ?? ""
  );
  const [dealerId, setDealerId] = useState(
    installation?.dealer_id ?? initialFarmer?.linked_dealer_id ?? ""
  );
  const [institutionId, setInstitutionId] = useState(
    installation?.institution_id ?? initialFarmer?.linked_institution_id ?? ""
  );
  const [pilotId, setPilotId] = useState(
    installation?.pilot_id ?? initialFarmer?.linked_pilot_id ?? ""
  );
  const [serialNumber, setSerialNumber] = useState(
    installation?.serial_number_snapshot ?? initialDevice?.serial_number ?? ""
  );
  const [productModel, setProductModel] = useState(
    installation?.product_model ?? initialDevice?.product_model ?? ""
  );
  const [previousHolderType, setPreviousHolderType] = useState(
    installation?.previous_holder_type ??
      initialDevice?.current_holder_type ??
      ""
  );
  const [previousHolderId, setPreviousHolderId] = useState(
    installation?.previous_holder_id ?? initialDevice?.current_holder_id ?? ""
  );
  const [previousHolderName, setPreviousHolderName] = useState(
    installation?.previous_holder_name_snapshot ??
      initialDevice?.current_holder_name_snapshot ??
      ""
  );
  const [installationDate, setInstallationDate] = useState(initialDate);
  const [followupDueDate, setFollowupDueDate] = useState(
    dateValue(installation?.followup_due_date) || addDays(initialDate, 15)
  );

  function applyFarmerLead(value: string) {
    const farmerLead = farmerLeads.find((lead) => lead.id === value);
    setSelectedFarmerLeadId(value);
    setFarmerName(farmerLead?.farmer_name ?? "");
    setFarmerMobile(farmerLead?.mobile_number ?? "");
    setStateValue(farmerLead?.state ?? "");
    setDistrictValue(farmerLead?.district ?? "");
    setTaluk(farmerLead?.taluk ?? "");
    setVillage(farmerLead?.village ?? "");
    setAddress(farmerLead?.full_address ?? "");
    setRsmUserId(farmerLead?.rsm_user_id ?? "");
    setRegionId(farmerLead?.region_id ?? "");
    setFollowupOwnerUserId(farmerLead?.owner_user_id ?? "");
    setDealerId(farmerLead?.linked_dealer_id ?? "");
    setInstitutionId(farmerLead?.linked_institution_id ?? "");
    setPilotId(farmerLead?.linked_pilot_id ?? "");
  }

  function applyDevice(value: string) {
    const device = devices.find((option) => option.id === value);
    setSelectedDeviceId(value);
    setSerialNumber(device?.serial_number ?? "");
    setProductModel(device?.product_model ?? "");
    setPreviousHolderType(device?.current_holder_type ?? "");
    setPreviousHolderId(device?.current_holder_id ?? "");
    setPreviousHolderName(device?.current_holder_name_snapshot ?? "");
  }

  function applyDispatch(value: string) {
    const dispatch = dispatches.find((option) => option.id === value);
    setSelectedDispatchId(value);

    if (!dispatch) {
      return;
    }

    applyDevice(dispatch.device_id);
    setSerialNumber(dispatch.serial_number_snapshot);
    setProductModel(dispatch.product_model);
    setDealerId(
      dispatch.linked_dealer_id ?? dispatch.destination_dealer_id ?? dealerId
    );
    setInstitutionId(
      dispatch.linked_institution_id ??
        dispatch.destination_institution_id ??
        institutionId
    );
    setPilotId(
      dispatch.linked_pilot_id ?? dispatch.destination_pilot_id ?? pilotId
    );
  }

  return (
    <form action={action} className="space-y-6">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      <input name="rsm_user_id" type="hidden" value={rsmUserId} />
      <input name="region_id" type="hidden" value={regionId} />
      <input
        name="followup_owner_user_id"
        type="hidden"
        value={followupOwnerUserId}
      />
      <input name="dealer_id" type="hidden" value={dealerId} />
      <input name="institution_id" type="hidden" value={institutionId} />
      <input name="pilot_id" type="hidden" value={pilotId} />
      <input name="previous_holder_id" type="hidden" value={previousHolderId} />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Installation details
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="installation_code"
            >
              Installation code
            </label>
            <input
              className={inputClassName()}
              defaultValue={installation?.installation_code ?? ""}
              id="installation_code"
              name="installation_code"
              placeholder="Auto-generated if blank"
              type="text"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="installation_date"
            >
              Installation date
            </label>
            <input
              className={inputClassName()}
              id="installation_date"
              name="installation_date"
              onChange={(event) => {
                setInstallationDate(event.target.value);
                if (event.target.value) {
                  setFollowupDueDate(addDays(event.target.value, 15));
                }
              }}
              required
              type="date"
              value={installationDate}
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="installation_status"
            >
              Installation status
            </label>
            <select
              className={inputClassName()}
              defaultValue={
                installation?.installation_status ?? defaultInstallationStatus
              }
              id="installation_status"
              name="installation_status"
              required
            >
              {installationStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="installation_type"
            >
              Installation type
            </label>
            <select
              className={inputClassName()}
              defaultValue={installation?.installation_type ?? ""}
              id="installation_type"
              name="installation_type"
              required
            >
              <option value="">Select installation type</option>
              {installationTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="installation_method"
            >
              Installation method
            </label>
            <select
              className={inputClassName()}
              defaultValue={installation?.installation_method ?? ""}
              id="installation_method"
              name="installation_method"
            >
              <option value="">Select method</option>
              {installationMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="dispatch_id"
            >
              Linked dispatch
            </label>
            <select
              className={inputClassName()}
              id="dispatch_id"
              name="dispatch_id"
              onChange={(event) => applyDispatch(event.target.value)}
              value={selectedDispatchId}
            >
              <option value="">No dispatch selected</option>
              {dispatches.map((dispatch) => (
                <option key={dispatch.id} value={dispatch.id}>
                  {dispatch.dispatch_code} · {dispatch.serial_number_snapshot}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">Farmer lead</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="farmer_lead_id"
            >
              Farmer lead
            </label>
            <select
              className={inputClassName()}
              id="farmer_lead_id"
              name="farmer_lead_id"
              onChange={(event) => applyFarmerLead(event.target.value)}
              required
              value={selectedFarmerLeadId}
            >
              <option value="">Select farmer lead</option>
              {farmerLeads.map((farmerLead) => (
                <option key={farmerLead.id} value={farmerLead.id}>
                  {farmerLabel(farmerLead)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="farmer_name_snapshot"
            >
              Farmer name
            </label>
            <input
              className={inputClassName()}
              id="farmer_name_snapshot"
              name="farmer_name_snapshot"
              readOnly
              required
              type="text"
              value={farmerName}
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="farmer_mobile_snapshot"
            >
              Farmer mobile
            </label>
            <input
              className={inputClassName()}
              id="farmer_mobile_snapshot"
              name="farmer_mobile_snapshot"
              readOnly
              required
              type="text"
              value={farmerMobile}
            />
          </div>

          <StateDistrictSelect
            districtName="district"
            districtValue={districtValue}
            onDistrictChange={setDistrictValue}
            onStateChange={setStateValue}
            required
            stateName="state"
            stateValue={stateValue}
          />

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="taluk"
            >
              Taluk
            </label>
            <input
              className={inputClassName()}
              id="taluk"
              name="taluk"
              onChange={(event) => setTaluk(event.target.value)}
              type="text"
              value={taluk}
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
              id="village"
              name="village"
              onChange={(event) => setVillage(event.target.value)}
              required
              type="text"
              value={village}
            />
          </div>

          <div className="md:col-span-2">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="installation_address"
            >
              Installation address
            </label>
            <textarea
              className={textAreaClassName()}
              id="installation_address"
              name="installation_address"
              onChange={(event) => setAddress(event.target.value)}
              value={address}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">Device</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="device_id"
            >
              Device
            </label>
            <select
              className={inputClassName()}
              id="device_id"
              name="device_id"
              onChange={(event) => applyDevice(event.target.value)}
              required
              value={selectedDeviceId}
            >
              <option value="">Select device</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {deviceLabel(device)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="serial_number_snapshot"
            >
              Serial number snapshot
            </label>
            <input
              className={inputClassName()}
              id="serial_number_snapshot"
              name="serial_number_snapshot"
              readOnly
              required
              type="text"
              value={serialNumber}
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="product_model"
            >
              Product model
            </label>
            <input
              className={inputClassName()}
              id="product_model"
              name="product_model"
              readOnly
              required
              type="text"
              value={productModel}
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="previous_holder_type"
            >
              Previous holder type
            </label>
            <select
              className={inputClassName()}
              id="previous_holder_type"
              name="previous_holder_type"
              onChange={(event) => setPreviousHolderType(event.target.value)}
              value={previousHolderType}
            >
              <option value="">Not set</option>
              {holderTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="previous_holder_name_snapshot"
            >
              Previous holder name
            </label>
            <input
              className={inputClassName()}
              id="previous_holder_name_snapshot"
              name="previous_holder_name_snapshot"
              onChange={(event) => setPreviousHolderName(event.target.value)}
              type="text"
              value={previousHolderName}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Site verification
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="gps_latitude"
            >
              GPS latitude
            </label>
            <input
              className={inputClassName()}
              defaultValue={installation?.gps_latitude ?? ""}
              id="gps_latitude"
              name="gps_latitude"
              required
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
              defaultValue={installation?.gps_longitude ?? ""}
              id="gps_longitude"
              name="gps_longitude"
              required
              step="any"
              type="number"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="gps_accuracy_meters"
            >
              GPS accuracy meters
            </label>
            <input
              className={inputClassName()}
              defaultValue={installation?.gps_accuracy_meters ?? ""}
              id="gps_accuracy_meters"
              name="gps_accuracy_meters"
              step="any"
              type="number"
            />
          </div>

          <FileUploadField
            currentValue={installation?.installation_photo_link}
            kind="image"
            label="Installation photo"
            name="installation_photo_link"
            required
          />

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="fitment_status"
            >
              Fitment status
            </label>
            <select
              className={inputClassName()}
              defaultValue={
                installation?.fitment_status ?? defaultFitmentStatus
              }
              id="fitment_status"
              name="fitment_status"
              required
            >
              {fitmentStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="farmer_confirmation"
            >
              Farmer confirmation
            </label>
            <select
              className={inputClassName()}
              defaultValue={
                installation?.farmer_confirmation ?? defaultFarmerConfirmation
              }
              id="farmer_confirmation"
              name="farmer_confirmation"
              required
            >
              {farmerConfirmationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="irrigation_line_type"
            >
              Irrigation line type
            </label>
            <select
              className={inputClassName()}
              defaultValue={installation?.irrigation_line_type ?? ""}
              id="irrigation_line_type"
              name="irrigation_line_type"
            >
              <option value="">Select line type</option>
              {irrigationLineTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="pipe_size"
            >
              Pipe size
            </label>
            <input
              className={inputClassName()}
              defaultValue={installation?.pipe_size ?? ""}
              id="pipe_size"
              name="pipe_size"
              type="text"
            />
          </div>

          <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              defaultChecked={installation?.issue_observed ?? false}
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
              defaultValue={installation?.issue_details ?? ""}
              id="issue_details"
              name="issue_details"
            />
          </div>

          <div className="md:col-span-2">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="installation_notes"
            >
              Installation notes
            </label>
            <textarea
              className={textAreaClassName()}
              defaultValue={installation?.installation_notes ?? ""}
              id="installation_notes"
              name="installation_notes"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">Follow-up</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              defaultChecked={installation?.followup_required ?? true}
              name="followup_required"
              type="checkbox"
            />
            Follow-up required
          </label>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="followup_due_date"
            >
              Follow-up due date
            </label>
            <input
              className={inputClassName()}
              id="followup_due_date"
              name="followup_due_date"
              onChange={(event) => setFollowupDueDate(event.target.value)}
              required
              type="date"
              value={followupDueDate}
            />
          </div>

          <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              defaultChecked={installation?.followup_completed ?? false}
              name="followup_completed"
              type="checkbox"
            />
            Follow-up completed
          </label>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="followup_completed_date"
            >
              Follow-up completed date
            </label>
            <input
              className={inputClassName()}
              defaultValue={dateValue(installation?.followup_completed_date)}
              id="followup_completed_date"
              name="followup_completed_date"
              type="date"
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
            mode === "create"
              ? "Create installation"
              : "Save installation"
          }
        />
      </div>
    </form>
  );
}
