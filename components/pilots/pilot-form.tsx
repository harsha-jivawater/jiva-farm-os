"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Save } from "lucide-react";
import {
  comparisonMethodOptions,
  cropOptions,
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
  monitoringFrequencyOptions,
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
import { hasRole } from "@/lib/users/permissions";
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
  users: UserOption[];
};

const pilotOwnerRoles = new Set(["Agronomist", "Research Assistant", "R&D Head"]);

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
  type = "text",
  value,
  onChange,
  readOnly = false
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
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
        type={type}
        value={value}
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

function farmerLabel(farmerLead: PilotFarmerLeadOption) {
  return `${farmerLead.lead_code} · ${farmerLead.farmer_name} · ${farmerLead.mobile_number}`;
}

function deviceLabel(device: PilotDeviceOption) {
  const code = device.device_code ? ` · ${device.device_code}` : "";
  return `${device.serial_number}${code} · ${device.product_model} · ${device.device_status}`;
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
            defaultValue={pilot?.pilot_name}
            label="Pilot name"
            name="pilot_name"
            required
          />
          <SelectField
            defaultValue={pilot?.pilot_type ?? defaultPilotType}
            label="Pilot type"
            name="pilot_type"
            options={pilotTypeOptions}
            required
          />
          <SelectField
            defaultValue={pilot?.pilot_status ?? defaultPilotStatus}
            label="Pilot status"
            name="pilot_status"
            options={pilotStatusOptions}
            required
          />
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
              <option value="">Select farmer lead</option>
              {farmerLeads.map((farmerLead) => (
                <option key={farmerLead.id} value={farmerLead.id}>
                  {farmerLabel(farmerLead)}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Farmer name snapshot"
            name="farmer_name_snapshot"
            onChange={setFarmerName}
            required
            value={farmerName}
          />
          <Field
            label="Farmer mobile snapshot"
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
            label="Location or cluster name"
            name="location_or_cluster_name"
          />
          <Field
            defaultValue={pilot?.gps_latitude}
            label="GPS latitude"
            name="gps_latitude"
            type="number"
          />
          <Field
            defaultValue={pilot?.gps_longitude}
            label="GPS longitude"
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
              <option value="">Select region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.region_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="institution_id"
            >
              Institution
            </label>
            <select
              className={inputClassName()}
              id="institution_id"
              name="institution_id"
              onChange={(event) => setInstitutionId(event.target.value)}
              value={institutionId}
            >
              <option value="">No institution</option>
              {institutions.map((institution) => (
                <option key={institution.id} value={institution.id}>
                  {institution.institution_code} · {institution.organization_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="dealer_id"
            >
              Dealer
            </label>
            <select
              className={inputClassName()}
              id="dealer_id"
              name="dealer_id"
              onChange={(event) => setDealerId(event.target.value)}
              value={dealerId}
            >
              <option value="">No dealer</option>
              {dealers.map((dealer) => (
                <option key={dealer.id} value={dealer.id}>
                  {dealer.dealer_code} · {dealer.dealer_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Crop, plots and device
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField
            label="Crop"
            name="crop"
            onChange={setCrop}
            options={cropOptions}
            required
            value={crop}
          />
          {crop === "Other" ? (
            <Field
              label="Other crop"
              name="other_crop"
              onChange={setOtherCrop}
              required
              value={otherCrop}
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
            label="Pilot area acres"
            name="pilot_area_acres"
            required
            type="number"
          />
          <Field
            defaultValue={pilot?.control_area_acres ?? 0}
            label="Control area acres"
            name="control_area_acres"
            required
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
          <SelectField
            defaultValue={pilot?.comparison_method ?? defaultComparisonMethod}
            label="Comparison method"
            name="comparison_method"
            options={comparisonMethodOptions}
            required
          />
          <div>
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
            label="Product model"
            name="product_model"
            onChange={setProductModel}
            options={productModelOptions}
            required
            value={productModel}
          />
          <Field
            label="Device serial number snapshot"
            name="device_serial_number_snapshot"
            onChange={setSerialNumber}
            value={serialNumber}
          />
          <Field
            defaultValue={pilot?.device_installation_date}
            label="Device installation date"
            name="device_installation_date"
            type="date"
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <CheckboxField
            defaultChecked={pilot?.control_available ?? true}
            label="Control available"
            name="control_available"
          />
          <CheckboxField
            defaultChecked={pilot?.control_farmer_same}
            label="Same control farmer"
            name="control_farmer_same"
          />
          <CheckboxField
            defaultChecked={pilot?.control_crop_same}
            label="Same control crop"
            name="control_crop_same"
          />
          <CheckboxField
            defaultChecked={pilot?.control_irrigation_same}
            label="Same control irrigation"
            name="control_irrigation_same"
          />
          <CheckboxField
            defaultChecked={pilot?.installation_completed}
            label="Installation completed"
            name="installation_completed"
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextareaField
            defaultValue={pilot?.baseline_notes}
            label="Baseline notes"
            name="baseline_notes"
          />
          <TextareaField
            defaultValue={pilot?.treatment_plot_description}
            label="Treatment plot description"
            name="treatment_plot_description"
            required
          />
          <TextareaField
            defaultValue={pilot?.control_plot_description}
            label="Control plot description"
            name="control_plot_description"
            required
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Monitoring plan
        </h2>
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
          <SelectField
            defaultValue={pilot?.monitoring_frequency ?? defaultMonitoringFrequency}
            label="Monitoring frequency"
            name="monitoring_frequency"
            options={monitoringFrequencyOptions}
            required
          />
          <Field
            defaultValue={pilot?.next_visit_due_date}
            label="Next visit due date"
            name="next_visit_due_date"
            type="date"
          />
          <Field
            defaultValue={pilot?.total_visits_planned}
            label="Total visits planned"
            name="total_visits_planned"
            required
            type="number"
          />
          <Field
            defaultValue={pilot?.monitoring_plan_link}
            label="Monitoring plan link"
            name="monitoring_plan_link"
            type="url"
          />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          This will create planned monitoring visits. Each completed visit
          requires a visit report.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <CheckboxField
            defaultChecked={pilot?.track_soil_moisture}
            label="Track soil moisture"
            name="track_soil_moisture"
          />
          <CheckboxField
            defaultChecked={pilot?.track_crop_growth}
            label="Track crop growth"
            name="track_crop_growth"
          />
          <CheckboxField
            defaultChecked={pilot?.track_irrigation_frequency}
            label="Track irrigation frequency"
            name="track_irrigation_frequency"
          />
          <CheckboxField
            defaultChecked={pilot?.track_water_saving}
            label="Track water saving"
            name="track_water_saving"
          />
          <CheckboxField
            defaultChecked={pilot?.track_fertilizer_usage}
            label="Track fertilizer usage"
            name="track_fertilizer_usage"
          />
          <CheckboxField
            defaultChecked={pilot?.track_pest_disease}
            label="Track pest disease"
            name="track_pest_disease"
          />
          <CheckboxField
            defaultChecked={pilot?.track_root_growth}
            label="Track root growth"
            name="track_root_growth"
          />
          <CheckboxField
            defaultChecked={pilot?.track_plant_height}
            label="Track plant height"
            name="track_plant_height"
          />
          <CheckboxField
            defaultChecked={pilot?.track_chlorophyll}
            label="Track chlorophyll"
            name="track_chlorophyll"
          />
          <CheckboxField
            defaultChecked={pilot?.track_yield}
            label="Track yield"
            name="track_yield"
          />
          <CheckboxField
            defaultChecked={pilot?.track_quality_parameters}
            label="Track quality parameters"
            name="track_quality_parameters"
          />
          <CheckboxField
            defaultChecked={pilot?.track_farmer_feedback ?? true}
            label="Track farmer feedback"
            name="track_farmer_feedback"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Results and links
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
          <Field
            defaultValue={pilot?.pilot_folder_link}
            label="Pilot folder link"
            name="pilot_folder_link"
            type="url"
          />
          <Field
            defaultValue={pilot?.baseline_report_link}
            label="Baseline report link"
            name="baseline_report_link"
            type="url"
          />
          <Field
            defaultValue={pilot?.final_pilot_report_link}
            label="Final pilot report link"
            name="final_pilot_report_link"
            type="url"
          />
          <Field
            defaultValue={pilot?.photo_folder_link}
            label="Photo folder link"
            name="photo_folder_link"
            type="url"
          />
          <Field
            defaultValue={pilot?.data_sheet_link}
            label="Data sheet link"
            name="data_sheet_link"
            type="url"
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
            label="Device serial number"
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
