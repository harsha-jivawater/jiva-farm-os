"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Info, Save } from "lucide-react";
import { CustomCropFields } from "@/components/crops/custom-crop-fields";
import { CropSelect } from "@/components/crops/crop-select";
import { PlannedVisitForm } from "@/components/pilots/planned-visit-form";
import { FileUploadField } from "@/components/uploads/file-upload-field";
import {
  comparisonMethodOptions,
  cropStageOptions,
  defaultComparisonMethod,
  defaultCrop,
  defaultIrrigationType,
  defaultMonitoringFrequency,
  defaultPilotResultStatus,
  defaultPilotStatus,
  defaultPilotType,
  defaultProductModel,
  irrigationTypeOptions,
  pilotResultStatusOptions,
  pilotStatusOptions,
  pilotTypeOptions,
  productModelOptions,
  waterSourceOptions
} from "@/lib/pilots/options";
import type {
  Pilot,
  PilotDealerOption,
  PilotDeviceOption,
  PilotFarmerLeadOption,
  PilotInstitutionOption,
  RegionOption,
  UserOption
} from "@/lib/pilots/types";
import { labelForRole } from "@/lib/users/options";
import { hasAnyRole, hasRole } from "@/lib/users/permissions";
import { StateDistrictSelect } from "@/src/components/location/StateDistrictSelect";

type PilotFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  dealers: PilotDealerOption[];
  devices: PilotDeviceOption[];
  error?: string | null;
  farmerLeads: PilotFarmerLeadOption[];
  institutions: PilotInstitutionOption[];
  pilot?: Pilot;
  regions: RegionOption[];
  currentUser: {
    role: string;
    secondary_role: string | null;
  };
  users: UserOption[];
};

const pilotOwnerRoles = new Set(["Agronomist", "Research Assistant", "R&D Head"]);
const pilotDeviceInstallRoles = ["Admin", "R&D Head", "Agronomist"];

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
}

function textareaClassName() {
  return "min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function todayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function booleanValue(value: boolean | null | undefined, defaultValue = false) {
  return (value ?? defaultValue) ? "true" : "false";
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={pending}
      type="submit"
    >
      <Save className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saving..." : "Save pilot"}
    </button>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required = false,
  helperText,
  step,
  type = "text",
  value,
  onChange,
  readOnly = false
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  helperText?: string;
  step?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
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
        defaultValue={value === undefined ? (defaultValue ?? "") : undefined}
        id={name}
        min={type === "number" ? 0 : undefined}
        name={name}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        readOnly={readOnly}
        required={required}
        step={step}
        type={type}
        value={value}
      />
      {helperText ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  helperText,
  required = false
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  helperText?: string;
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
      {helperText ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

function SelectField({
  defaultValue,
  label,
  name,
  onChange,
  options,
  placeholder,
  required = false,
  value
}: {
  defaultValue?: string | null;
  label: string;
  name: string;
  onChange?: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  value?: string;
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
        defaultValue={value === undefined ? (defaultValue ?? "") : undefined}
        id={name}
        name={name}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        required={required}
        value={value}
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

function UserSelect({
  defaultValue,
  label,
  name,
  options,
  required = false,
  value,
  onChange
}: {
  defaultValue?: string | null;
  label: string;
  name: string;
  options: UserOption[];
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
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
        defaultValue={value === undefined ? (defaultValue ?? "") : undefined}
        id={name}
        name={name}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        required={required}
        value={value}
      >
        <option value="">Select {label}</option>
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

function ComparisonMethodHelp() {
  return (
    <details className="group relative">
      <summary
        aria-label="Comparison method help"
        className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-brand-200 hover:text-brand-700"
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 shadow-xl">
        <p className="font-semibold text-slate-950">
          Comparison method means: Compared to what are we judging whether Jiva
          made a difference?
        </p>
        <div className="mt-3 space-y-2">
          <p><strong>Same Farmer Split Study:</strong> Same farmer, same crop, same season. One part uses Jiva, another similar part does not. Best proof quality.</p>
          <p><strong>Same Farmer - Different Plot:</strong> Same farmer has two different plots. Jiva is used in one plot and the other plot is comparison.</p>
          <p><strong>Nearby Farmer - Similar Crop:</strong> A nearby farmer growing the same or similar crop is used as comparison.</p>
          <p><strong>Historical Baseline:</strong> Compare current crop performance after Jiva against the same farmer&apos;s past crop performance.</p>
          <p><strong>Before / After Only:</strong> Measure before and after Jiva in the same plot, without a separate control.</p>
          <p><strong>No Control Available:</strong> No comparison plot, farmer, or historical baseline is available. Use only for demonstration or observation.</p>
          <p><strong>Other:</strong> A comparison method not covered above. Explain it in notes.</p>
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Proof strength
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Strongest: Same Farmer Split Study · Very good: Same Farmer -
          Different Plot · Good: Nearby Farmer - Similar Crop · Moderate:
          Historical Baseline · Weak: Before / After Only · Weakest: No Control
          Available
        </p>
      </div>
    </details>
  );
}

function farmerLabel(farmerLead: PilotFarmerLeadOption) {
  return `${farmerLead.lead_code} · ${farmerLead.farmer_name} · ${farmerLead.mobile_number}`;
}

function deviceLabel(device: PilotDeviceOption) {
  const code = device.device_code ? ` · ${device.device_code}` : "";
  return `${device.serial_number}${code} · ${device.product_model} · ${device.device_status}`;
}

function shortPilotContextName(name: string | null | undefined) {
  const cleaned = String(name ?? "")
    .replace(/\b(LLP|PVT|PRIVATE|LIMITED|LTD|INC|COMPANY|CO)\b\.?/gi, " ")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "Pilot";
  }

  const words = cleaned
    .split(" ")
    .filter(
      (word) =>
        word.length > 1 &&
        !["and", "the", "of"].includes(word.toLowerCase())
    );

  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  return words[0] ?? cleaned.split(" ")[0] ?? "Pilot";
}

function suggestedPilotName({
  dealer,
  farmer,
  institution,
  pilotType
}: {
  dealer?: PilotDealerOption;
  farmer?: PilotFarmerLeadOption;
  institution?: PilotInstitutionOption;
  pilotType: string;
}) {
  if (pilotType === "Institution Pilot") {
    return `${shortPilotContextName(institution?.organization_name)} Pilot - 01`;
  }

  if (pilotType === "Dealer Pilot") {
    return `${shortPilotContextName(dealer?.firm_name ?? dealer?.dealer_name)} Pilot - 01`;
  }

  return `${farmer?.farmer_name || "Farmer"} Pilot - 01`;
}

export function PilotForm({
  action,
  cancelHref,
  dealers,
  devices,
  error,
  farmerLeads,
  institutions,
  pilot,
  regions,
  currentUser,
  users
}: PilotFormProps) {
  const initialFarmer = useMemo(
    () => farmerLeads.find((lead) => lead.id === pilot?.farmer_lead_id),
    [farmerLeads, pilot?.farmer_lead_id]
  );
  const initialDevice = useMemo(
    () => devices.find((device) => device.id === pilot?.device_id),
    [devices, pilot?.device_id]
  );
  const pilotUsers = users.filter((user) =>
    Array.from(pilotOwnerRoles).some((role) => hasRole(user, role))
  );
  const rsmUsers = users.filter((user) => hasRole(user, "RSM"));
  const researchAssistants = users.filter(
    (user) => hasRole(user, "Research Assistant")
  );
  const agronomists = users.filter((user) => hasRole(user, "Agronomist"));
  const rdHeads = users.filter((user) => hasRole(user, "R&D Head"));
  const [selectedFarmerLeadId, setSelectedFarmerLeadId] = useState(
    pilot?.farmer_lead_id ?? initialFarmer?.id ?? ""
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState(
    pilot?.device_id ?? initialDevice?.id ?? ""
  );
  const [pilotType, setPilotType] = useState(
    pilot?.pilot_type ?? defaultPilotType
  );
  const [pilotName, setPilotName] = useState(pilot?.pilot_name ?? "");
  const [pilotNameEdited, setPilotNameEdited] = useState(Boolean(pilot?.pilot_name));
  const [farmerName, setFarmerName] = useState(
    pilot?.farmer_name_snapshot ?? initialFarmer?.farmer_name ?? ""
  );
  const [farmerMobile, setFarmerMobile] = useState(
    pilot?.farmer_mobile_snapshot ?? initialFarmer?.mobile_number ?? ""
  );
  const [stateValue, setStateValue] = useState(
    pilot?.state ?? initialFarmer?.state ?? ""
  );
  const [districtValue, setDistrictValue] = useState(
    pilot?.district ?? initialFarmer?.district ?? ""
  );
  const [taluk, setTaluk] = useState(
    pilot?.taluk ?? initialFarmer?.taluk ?? ""
  );
  const [village, setVillage] = useState(
    pilot?.village ?? initialFarmer?.village ?? ""
  );
  const [rsmUserId, setRsmUserId] = useState(
    pilot?.rsm_user_id ?? initialFarmer?.rsm_user_id ?? ""
  );
  const [regionId, setRegionId] = useState(
    pilot?.region_id ?? initialFarmer?.region_id ?? ""
  );
  const [institutionId, setInstitutionId] = useState(
    pilot?.institution_id ?? initialFarmer?.linked_institution_id ?? ""
  );
  const [dealerId, setDealerId] = useState(
    pilot?.dealer_id ?? initialFarmer?.linked_dealer_id ?? ""
  );
  const [crop, setCrop] = useState(
    pilot?.crop ?? initialFarmer?.primary_crop ?? defaultCrop
  );
  const [otherCrop, setOtherCrop] = useState(
    pilot?.other_crop ?? initialFarmer?.other_primary_crop ?? ""
  );
  const [cropStage, setCropStage] = useState(
    pilot?.crop_stage_at_start ?? initialFarmer?.crop_stage ?? ""
  );
  const [irrigationType, setIrrigationType] = useState(
    pilot?.irrigation_type ?? initialFarmer?.irrigation_type ?? defaultIrrigationType
  );
  const [waterSource, setWaterSource] = useState(
    pilot?.water_source ?? initialFarmer?.water_source ?? ""
  );
  const [soilType, setSoilType] = useState(
    pilot?.soil_type ?? initialFarmer?.soil_type ?? ""
  );
  const [productModel, setProductModel] = useState(
    pilot?.product_model ?? initialDevice?.product_model ?? defaultProductModel
  );
  const [serialNumber, setSerialNumber] = useState(
    pilot?.device_serial_number_snapshot ?? initialDevice?.serial_number ?? ""
  );
  const isInstitutionPilot = pilotType === "Institution Pilot";
  const isDealerPilot = pilotType === "Dealer Pilot";
  const canManagePilotDeviceInstall = hasAnyRole(
    currentUser,
    pilotDeviceInstallRoles
  );
  const canManageVisitPlans = hasAnyRole(currentUser, [
    "Admin",
    "R&D Head",
    "Agronomist"
  ]);
  const [initialVisitKeys, setInitialVisitKeys] = useState<number[]>([]);
  const pilotStatusFieldOptions = canManagePilotDeviceInstall
    ? pilotStatusOptions
    : pilotStatusOptions.filter((option) => option.value !== "Device Installed");
  const lockPilotStatusAsDeviceInstalled =
    !canManagePilotDeviceInstall && pilot?.pilot_status === "Device Installed";
  const pilotTrialDescription =
    pilot?.baseline_notes ??
    [pilot?.treatment_plot_description, pilot?.control_plot_description]
      .filter(Boolean)
      .join("\n\n");

  function suggestName({
    nextDealerId = dealerId,
    nextFarmerLeadId = selectedFarmerLeadId,
    nextInstitutionId = institutionId,
    nextPilotType = pilotType
  }: {
    nextDealerId?: string;
    nextFarmerLeadId?: string;
    nextInstitutionId?: string;
    nextPilotType?: string;
  } = {}) {
    if (pilotNameEdited) {
      return;
    }

    const farmer = farmerLeads.find((lead) => lead.id === nextFarmerLeadId);
    const institution = institutions.find(
      (option) => option.id === nextInstitutionId
    );
    const dealer = dealers.find((option) => option.id === nextDealerId);

    setPilotName(
      suggestedPilotName({
        dealer,
        farmer,
        institution,
        pilotType: nextPilotType
      })
    );
  }

  function handlePilotTypeChange(value: string) {
    setPilotType(value);
    suggestName({ nextPilotType: value });
  }

  function applyFarmerLead(value: string) {
    const farmerLead = farmerLeads.find((lead) => lead.id === value);
    setSelectedFarmerLeadId(value);
    setFarmerName(farmerLead?.farmer_name ?? "");
    setFarmerMobile(farmerLead?.mobile_number ?? "");
    setStateValue(farmerLead?.state ?? "");
    setDistrictValue(farmerLead?.district ?? "");
    setTaluk(farmerLead?.taluk ?? "");
    setVillage(farmerLead?.village ?? "");
    setRsmUserId(farmerLead?.rsm_user_id ?? "");
    setRegionId(farmerLead?.region_id ?? "");
    setInstitutionId(farmerLead?.linked_institution_id ?? "");
    setDealerId(farmerLead?.linked_dealer_id ?? "");
    setCrop(farmerLead?.primary_crop ?? defaultCrop);
    setOtherCrop(farmerLead?.other_primary_crop ?? "");
    setCropStage(farmerLead?.crop_stage ?? "");
    setIrrigationType(farmerLead?.irrigation_type ?? defaultIrrigationType);
    setWaterSource(farmerLead?.water_source ?? "");
    setSoilType(farmerLead?.soil_type ?? "");
    suggestName({
      nextDealerId: farmerLead?.linked_dealer_id ?? "",
      nextFarmerLeadId: value,
      nextInstitutionId: farmerLead?.linked_institution_id ?? ""
    });
  }

  function applyDevice(value: string) {
    const device = devices.find((option) => option.id === value);
    setSelectedDeviceId(value);
    setSerialNumber(device?.serial_number ?? "");
    setProductModel(device?.product_model ?? defaultProductModel);
  }

  return (
    <form action={action} className="space-y-6">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Pilot basics
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {pilot ? (
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">
                Pilot code
              </p>
              <p className="min-h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                {pilot.pilot_code}
              </p>
            </div>
          ) : null}
          <Field
            label="Pilot name"
            name="pilot_name"
            helperText="Auto-suggested from pilot type and linked context. You can edit if needed."
            onChange={(value) => {
              setPilotName(value);
              setPilotNameEdited(true);
            }}
            value={pilotName}
          />
          <SelectField
            label="Pilot type"
            name="pilot_type"
            onChange={handlePilotTypeChange}
            options={pilotTypeOptions}
            required
            value={pilotType}
          />
          <div className="rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-sm leading-6 text-sky-900 md:col-span-2">
            {isInstitutionPilot
              ? "Use this when the farmer pilot is conducted through an institution/company."
              : isDealerPilot
                ? "Use this when the farmer pilot is conducted through a dealer."
                : "Pilot devices are temporary and return to Jiva after completion. Farmer sales follow-up starts after pilot completion."}
          </div>
          {lockPilotStatusAsDeviceInstalled ? (
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">
                Pilot status
              </p>
              <p className="min-h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                Device Installed
              </p>
              <input name="pilot_status" type="hidden" value="Device Installed" />
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Only Admin, R&D Head, or Agronomist can change this milestone.
              </p>
            </div>
          ) : (
            <SelectField
              defaultValue={pilot?.pilot_status ?? defaultPilotStatus}
              label="Pilot status"
              name="pilot_status"
              options={pilotStatusFieldOptions}
              required
            />
          )}
          <SelectField
            defaultValue={pilot?.pilot_result_status ?? defaultPilotResultStatus}
            label="Pilot result status"
            name="pilot_result_status"
            options={pilotResultStatusOptions}
            required
          />
          <div className="md:col-span-2">
            <TextareaField
              defaultValue={pilot?.pilot_objective}
              label="Pilot objective"
              name="pilot_objective"
              required
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Farmer, partner and ownership
        </h2>
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
              <option value="">Select Farmer Lead</option>
              {farmerLeads.map((farmerLead) => (
                <option key={farmerLead.id} value={farmerLead.id}>
                  {farmerLabel(farmerLead)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Select a Farmer Lead to auto-fill farmer, crop, location, RSM,
              and linked institution or dealer details where available.
            </p>
          </div>
          <Field
            label="Farmer Name"
            name="farmer_name_snapshot"
            onChange={setFarmerName}
            required
            value={farmerName}
          />
          <Field
            label="Farmer Mobile"
            name="farmer_mobile_snapshot"
            onChange={setFarmerMobile}
            required
            type="tel"
            value={farmerMobile}
          />
          <StateDistrictSelect
            districtValue={districtValue}
            onDistrictChange={setDistrictValue}
            onStateChange={setStateValue}
            required
            stateValue={stateValue}
          />
          <Field label="Taluk" name="taluk" onChange={setTaluk} value={taluk} />
          <Field
            label="Village"
            name="village"
            onChange={setVillage}
            required
            value={village}
          />
          <Field
            defaultValue={pilot?.location_or_cluster_name}
            label="Location / Cluster"
            name="location_or_cluster_name"
          />
          <Field
            defaultValue={pilot?.gps_latitude}
            label="GPS Latitude"
            name="gps_latitude"
            type="number"
          />
          <Field
            defaultValue={pilot?.gps_longitude}
            label="GPS Longitude"
            name="gps_longitude"
            type="number"
          />
          <UserSelect
            defaultValue={pilot?.pilot_owner_user_id}
            label="Pilot owner"
            name="pilot_owner_user_id"
            options={pilotUsers}
            required
          />
          <UserSelect
            defaultValue={pilot?.research_assistant_user_id}
            label="Research Assistant"
            name="research_assistant_user_id"
            options={researchAssistants}
          />
          <UserSelect
            defaultValue={pilot?.agronomist_user_id}
            label="Agronomist"
            name="agronomist_user_id"
            options={agronomists}
          />
          <UserSelect
            defaultValue={pilot?.rd_head_user_id}
            label="R&D Head"
            name="rd_head_user_id"
            options={rdHeads}
          />
          <UserSelect
            label="RSM"
            name="rsm_user_id"
            onChange={setRsmUserId}
            options={rsmUsers}
            value={rsmUserId}
          />
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="region_id"
            >
              Region
            </label>
            <select
              className={inputClassName()}
              id="region_id"
              name="region_id"
              onChange={(event) => setRegionId(event.target.value)}
              value={regionId}
            >
              <option value="">Select Region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.region_name}
                </option>
              ))}
            </select>
          </div>
          {isInstitutionPilot ? (
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-slate-700"
                htmlFor="institution_id"
              >
                Through institution
              </label>
              <select
                className={inputClassName()}
                id="institution_id"
                name="institution_id"
                onChange={(event) => {
                  setInstitutionId(event.target.value);
                  suggestName({ nextInstitutionId: event.target.value });
                }}
                required
                value={institutionId}
              >
                <option value="">Select Institution</option>
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.institution_code} · {institution.organization_name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Required for Institution Pilot.
              </p>
            </div>
          ) : (
            <input name="institution_id" type="hidden" value="" />
          )}
          {isDealerPilot ? (
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-slate-700"
                htmlFor="dealer_id"
              >
                Through dealer
              </label>
              <select
                className={inputClassName()}
                id="dealer_id"
                name="dealer_id"
                onChange={(event) => {
                  setDealerId(event.target.value);
                  suggestName({ nextDealerId: event.target.value });
                }}
                required
                value={dealerId}
              >
                <option value="">Select Dealer</option>
                {dealers.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.dealer_code} · {dealer.dealer_name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Required for Dealer Pilot.
              </p>
            </div>
          ) : (
            <input name="dealer_id" type="hidden" value="" />
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Crop, plots, device, and baseline evidence
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <CropSelect
            label="Crop"
            name="crop"
            onChange={setCrop}
            required
            value={crop}
          />
          {crop === "Other" ? (
            <CustomCropFields
              defaultValue={otherCrop}
              name="other_crop"
              required
            />
          ) : (
            <input name="other_crop" type="hidden" value={otherCrop} />
          )}
          <SelectField
            label="Crop stage at start"
            name="crop_stage_at_start"
            onChange={setCropStage}
            options={cropStageOptions}
            placeholder="Select crop stage"
            value={cropStage}
          />
          <Field
            defaultValue={pilot?.pilot_area_acres ?? initialFarmer?.crop_area_acres ?? 0}
            label="Pilot Area Acres"
            name="pilot_area_acres"
            required
            step="0.01"
            type="number"
          />
          <Field
            defaultValue={pilot?.control_area_acres ?? 0}
            label="Control Area Acres"
            name="control_area_acres"
            required
            step="0.01"
            type="number"
          />
          <SelectField
            label="Irrigation type"
            name="irrigation_type"
            onChange={setIrrigationType}
            options={irrigationTypeOptions}
            required
            value={irrigationType}
          />
          <SelectField
            label="Water source"
            name="water_source"
            onChange={setWaterSource}
            options={waterSourceOptions}
            placeholder="Select water source"
            value={waterSource}
          />
          <Field
            label="Soil type"
            name="soil_type"
            onChange={setSoilType}
            value={soilType}
          />
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <label
                className="block text-sm font-medium text-slate-700"
                htmlFor="comparison_method"
              >
                Comparison method
              </label>
              <ComparisonMethodHelp />
            </div>
            <select
              className={inputClassName()}
              defaultValue={pilot?.comparison_method ?? defaultComparisonMethod}
              id="comparison_method"
              name="comparison_method"
              required
            >
              {comparisonMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="device_id"
            >
              Pilot Device
            </label>
            <select
              className={inputClassName()}
              id="device_id"
              name="device_id"
              onChange={(event) => applyDevice(event.target.value)}
              value={selectedDeviceId}
            >
              <option value="">No device assigned</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {deviceLabel(device)}
                </option>
              ))}
            </select>
          </div>
          <SelectField
            label="Product Model"
            name="product_model"
            onChange={setProductModel}
            options={productModelOptions}
            required
            value={productModel}
          />
          <Field
            label="Pilot Device Serial Number"
            name="device_serial_number_snapshot"
            onChange={setSerialNumber}
            value={serialNumber}
          />
          {canManagePilotDeviceInstall ? (
            <Field
              defaultValue={pilot?.device_installation_date}
              label="Pilot Device Installation Date"
              name="device_installation_date"
              type="date"
            />
          ) : (
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">
                Pilot Device Installation Date
              </p>
              <p className="min-h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                {pilot?.device_installation_date ?? "Not set"}
              </p>
              <input
                name="device_installation_date"
                type="hidden"
                value={pilot?.device_installation_date ?? ""}
              />
            </div>
          )}
        </div>
        {canManagePilotDeviceInstall ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <CheckboxField
              defaultChecked={pilot?.installation_completed}
              label="Pilot Device Installed"
              name="installation_completed"
            />
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-sm font-medium text-slate-700">
              Pilot Device Installed
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {pilot?.installation_completed ? "Yes" : "No"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Only Admin, R&D Head, or Agronomist can mark the pilot device as
              installed.
            </p>
            <input
              name="installation_completed"
              type="hidden"
              value={booleanValue(pilot?.installation_completed)}
            />
          </div>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <TextareaField
              defaultValue={pilotTrialDescription}
              helperText="Briefly describe the baseline condition, treatment plot, control plot, and important setup notes."
              label="Pilot / Trial Description"
              name="baseline_notes"
              required
            />
          </div>
          <input
            name="treatment_plot_description"
            type="hidden"
            value={pilot?.treatment_plot_description ?? ""}
          />
          <input
            name="control_plot_description"
            type="hidden"
            value={pilot?.control_plot_description ?? ""}
          />
          <FileUploadField
            currentValue={pilot?.soil_report_link}
            kind="lab-report"
            label="Soil Report"
            name="soil_report_link"
          />
          <FileUploadField
            currentValue={pilot?.water_report_link}
            kind="lab-report"
            label="Water Report"
            name="water_report_link"
          />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Pilot Installation is a temporary trial setup. It does not mark the
          Farmer Lead as Device Installed or count as a farmer sale.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Monitoring dates and plan file
        </h2>
        <input
          name="monitoring_frequency"
          type="hidden"
          value={pilot?.monitoring_frequency ?? defaultMonitoringFrequency}
        />
        <input
          name="next_visit_due_date"
          type="hidden"
          value={pilot?.next_visit_due_date ?? ""}
        />
        <input
          name="total_visits_planned"
          type="hidden"
          value={pilot?.total_visits_planned ?? ""}
        />
        <input
          name="track_soil_moisture"
          type="hidden"
          value={booleanValue(pilot?.track_soil_moisture)}
        />
        <input
          name="track_crop_growth"
          type="hidden"
          value={booleanValue(pilot?.track_crop_growth)}
        />
        <input
          name="track_irrigation_frequency"
          type="hidden"
          value={booleanValue(pilot?.track_irrigation_frequency)}
        />
        <input
          name="track_water_saving"
          type="hidden"
          value={booleanValue(pilot?.track_water_saving)}
        />
        <input
          name="track_fertilizer_usage"
          type="hidden"
          value={booleanValue(pilot?.track_fertilizer_usage)}
        />
        <input
          name="track_pest_disease"
          type="hidden"
          value={booleanValue(pilot?.track_pest_disease)}
        />
        <input
          name="track_root_growth"
          type="hidden"
          value={booleanValue(pilot?.track_root_growth)}
        />
        <input
          name="track_plant_height"
          type="hidden"
          value={booleanValue(pilot?.track_plant_height)}
        />
        <input
          name="track_chlorophyll"
          type="hidden"
          value={booleanValue(pilot?.track_chlorophyll)}
        />
        <input
          name="track_yield"
          type="hidden"
          value={booleanValue(pilot?.track_yield)}
        />
        <input
          name="track_quality_parameters"
          type="hidden"
          value={booleanValue(pilot?.track_quality_parameters)}
        />
        <input
          name="track_farmer_feedback"
          type="hidden"
          value={booleanValue(pilot?.track_farmer_feedback, true)}
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field
            defaultValue={pilot?.monitoring_start_date ?? todayDate()}
            label="Monitoring start date"
            name="monitoring_start_date"
            type="date"
          />
          <Field
            defaultValue={pilot?.expected_monitoring_end_date}
            label="Expected monitoring end date"
            name="expected_monitoring_end_date"
            type="date"
          />
          <FileUploadField
            currentValue={pilot?.monitoring_plan_link}
            kind="document"
            label="Monitoring plan file"
            name="monitoring_plan_link"
          />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Detailed visit dates, assignees, crop stages, and parameters are
          managed in the Monitoring Plan section after the pilot is created.
        </p>
        <input
          name="pilot_folder_link"
          type="hidden"
          value={pilot?.pilot_folder_link ?? ""}
        />
        <input
          name="baseline_report_link"
          type="hidden"
          value={pilot?.baseline_report_link ?? ""}
        />
        <input
          name="photo_folder_link"
          type="hidden"
          value={pilot?.photo_folder_link ?? ""}
        />
      </div>

      {!pilot && canManageVisitPlans ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Monitoring Plan
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Plan the visit dates, visit type, assigned Research Assistant,
                crop stage, parameters, and instructions for this pilot.
              </p>
            </div>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm hover:bg-slate-50"
              onClick={() =>
                setInitialVisitKeys((keys) => [
                  ...keys,
                  keys.length ? Math.max(...keys) + 1 : 0
                ])
              }
              type="button"
            >
              Add Visit
            </button>
          </div>
          <input
            name="initial_planned_visit_count"
            type="hidden"
            value={initialVisitKeys.length}
          />
          <div className="mt-4 space-y-3">
            {initialVisitKeys.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm leading-6 text-slate-500">
                No planned visits yet. Add the first planned visit for this
                pilot.
              </div>
            ) : null}
            {initialVisitKeys.map((key, index) => (
              <details
                className="rounded-md border border-slate-200 bg-slate-50"
                key={key}
                open
              >
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-950">
                  Visit {index + 1}
                </summary>
                <div className="border-t border-slate-200 p-4">
                  <PlannedVisitForm
                    action={action}
                    compact
                    fieldPrefix={`initial_planned_visit_${index}_`}
                    nextVisitNumber={index + 1}
                    showSubmit={false}
                    users={users}
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      className="text-sm font-semibold text-red-700 hover:text-red-800"
                      onClick={() =>
                        setInitialVisitKeys((keys) =>
                          keys.filter((visitKey) => visitKey !== key)
                        )
                      }
                      type="button"
                    >
                      Remove visit
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Final report and results
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextareaField
            defaultValue={pilot?.result_summary}
            label="Result summary"
            name="result_summary"
          />
          <TextareaField
            defaultValue={pilot?.farmer_feedback_summary}
            label="Farmer feedback summary"
            name="farmer_feedback_summary"
          />
          <TextareaField
            defaultValue={pilot?.partner_feedback}
            label="Partner feedback"
            name="partner_feedback"
          />
          <Field
            defaultValue={pilot?.scale_up_potential_devices}
            label="Scale-up potential devices"
            name="scale_up_potential_devices"
            type="number"
          />
          <Field
            defaultValue={pilot?.scale_up_potential_farmers}
            label="Scale-up potential farmers"
            name="scale_up_potential_farmers"
            type="number"
          />
          <Field
            defaultValue={pilot?.scale_up_next_step}
            label="Scale-up next step"
            name="scale_up_next_step"
          />
          <FileUploadField
            currentValue={pilot?.final_pilot_report_link}
            kind="document"
            label="Final pilot report file"
            name="final_pilot_report_link"
          />
          <FileUploadField
            currentValue={pilot?.data_sheet_link}
            kind="sheet"
            label="Pilot data sheet"
            name="data_sheet_link"
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <CheckboxField
            defaultChecked={pilot?.yield_improvement_observed}
            label="Yield improvement observed"
            name="yield_improvement_observed"
          />
          <CheckboxField
            defaultChecked={pilot?.water_saving_observed}
            label="Water saving observed"
            name="water_saving_observed"
          />
          <CheckboxField
            defaultChecked={pilot?.crop_health_improvement_observed}
            label="Crop health improvement observed"
            name="crop_health_improvement_observed"
          />
          <CheckboxField
            defaultChecked={pilot?.scale_up_recommended}
            label="Scale-up recommended"
            name="scale_up_recommended"
          />
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Pilot device removal
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Record field removal here. Customer Service Team will update final
          device stock status and location separately.
        </p>
        <input
          name="device_removal_status"
          type="hidden"
          value={
            pilot?.device_removal_status === "Resolved"
              ? "Resolved"
              : pilot?.device_removal_reason
                ? "Pending Customer Service Update"
                : "Not Removed"
          }
        />
        <input
          name="device_removal_device_id"
          type="hidden"
          value={pilot?.device_removal_device_id ?? pilot?.device_id ?? ""}
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field
            defaultValue={pilot?.device_removed_date}
            label="Removal date"
            name="device_removed_date"
            type="date"
          />
          <Field
            defaultValue={pilot?.device_serial_number_snapshot}
            label="Pilot Device Serial Number"
            name="device_removal_serial_snapshot"
          />
          <div className="md:col-span-2">
            <TextareaField
              defaultValue={pilot?.device_removal_reason}
              label="Removal reason"
              name="device_removal_reason"
            />
          </div>
          <div className="rounded-md border border-amber-200 bg-white/70 px-3 py-2 text-sm leading-6 text-amber-900 md:col-span-2">
            Current removal status: {pilot?.device_removal_status ?? "Not Removed"}
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
        <SubmitButton />
      </div>
    </form>
  );
}
