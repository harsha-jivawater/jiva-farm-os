"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Save, Search } from "lucide-react";
import { CustomCropFields } from "@/components/crops/custom-crop-fields";
import { CropMultiSelect } from "@/components/crops/crop-multi-select";
import { FileUploadField } from "@/components/uploads/file-upload-field";
import { SectorSelect } from "@/components/sector/sector-select";
import { defaultNextActionDate } from "@/lib/institutions/form-data";
import {
  agreementStatusOptions,
  defaultAgreementStatus,
  defaultInstitutionStatus,
  defaultOpportunityType,
  defaultOrganizationType,
  defaultOverallPilotStatus,
  defaultPriority,
  defaultProposalShared,
  defaultScaleUpStatus,
  expectedCommercialModelOptions,
  farmerRelationshipTypeOptions,
  institutionStatusOptions,
  involvementStatusOptions,
  opportunityTypeOptions,
  organizationTypeOptions,
  priorityOptions,
  rdInvolvementStatusOptions,
  scaleUpStatusOptions,
  overallPilotStatusOptions,
  yesNoPendingNaOptions
} from "@/lib/institutions/options";
import type {
  Institution,
  RegionOption,
  UserOption
} from "@/lib/institutions/types";
import { labelForRole } from "@/lib/users/options";
import { hasRole } from "@/lib/users/permissions";
import { StateDistrictSelect } from "@/src/components/location/StateDistrictSelect";
import { INDIAN_STATES_AND_UTS } from "@/src/lib/india-locations";

type InstitutionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  canApproveLegalDocuments?: boolean;
  cancelHref: string;
  error?: string | null;
  institution?: Institution;
  legalApprovalOnly?: boolean;
  regions: RegionOption[];
  users: UserOption[];
};

const accountOwnerRoles = new Set(["Sales Head", "RSM", "Salesperson", "Admin"]);
const salesHeadRoles = new Set(["Sales Head", "Admin"]);
const technicalOwnerRoles = new Set([
  "Agronomist",
  "Research Assistant",
  "R&D Head"
]);
const legalApprovalStatusOptions = [
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" }
] as const;

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
}

function textareaClassName() {
  return "min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function SubmitButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={pending || disabled}
      type="submit"
    >
      <Save className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saving..." : "Save institution"}
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
  defaultValue
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
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
      />
    </div>
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

function UserSelectField({
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
  const placeholder = `Select ${label}`;

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
        disabled={required && options.length === 0}
        id={name}
        name={name}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((user) => (
          <option key={user.id} value={user.id}>
            {user.full_name} · {labelForRole(user.role)}
          </option>
        ))}
      </select>
    </div>
  );
}

function StateRegionMultiSelect({
  label,
  name,
  onChange,
  options,
  values
}: {
  label: string;
  name: string;
  onChange: (values: string[]) => void;
  options: string[];
  values: string[];
}) {
  const [query, setQuery] = useState("");
  const valueSet = useMemo(() => new Set(values), [values]);
  const visibleOptions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    return trimmed
      ? options.filter((option) => option.toLowerCase().includes(trimmed))
      : options;
  }, [options, query]);

  function toggleValue(value: string) {
    onChange(
      valueSet.has(value)
        ? values.filter((current) => current !== value)
        : [...values, value]
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      {values.map((value) => (
        <input key={value} name={name} type="hidden" value={value} />
      ))}
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
        />
        <input
          className={`${inputClassName()} pl-9`}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search state or region"
          type="search"
          value={query}
        />
      </div>
      {values.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <button
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 transition hover:bg-brand-100"
              key={value}
              onClick={() => toggleValue(value)}
              type="button"
            >
              {value}
              <span aria-hidden="true" className="text-brand-500">
                ×
              </span>
              <span className="sr-only">Remove {value}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-2 max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-white">
        {visibleOptions.length === 0 ? (
          <p className="px-3 py-4 text-sm text-slate-500">
            No states or regions found.
          </p>
        ) : (
          visibleOptions.map((option) => {
            const checked = valueSet.has(option);

            return (
              <label
                className={[
                  "flex cursor-pointer items-start gap-3 border-b border-slate-100 px-3 py-2 text-sm transition last:border-b-0",
                  checked
                    ? "bg-brand-50 text-brand-900"
                    : "text-slate-700 hover:bg-slate-50"
                ].join(" ")}
                key={option}
              >
                <input
                  checked={checked}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  onChange={() => toggleValue(option)}
                  type="checkbox"
                />
                <span className="block font-semibold">{option}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

export function InstitutionForm({
  action,
  canApproveLegalDocuments = false,
  cancelHref,
  error,
  institution,
  legalApprovalOnly = false,
  regions,
  users
}: InstitutionFormProps) {
  const initialCropFocus = useMemo(
    () => institution?.crop_focus ?? [],
    [institution]
  );
  const [primaryState, setPrimaryState] = useState(
    institution?.primary_state ?? ""
  );
  const [primaryDistrict, setPrimaryDistrict] = useState(
    institution?.districts_covered ?? ""
  );
  const [selectedCropFocus, setSelectedCropFocus] =
    useState<string[]>(initialCropFocus);
  const [selectedRegionsCovered, setSelectedRegionsCovered] = useState(
    institution?.regions_covered ?? []
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const accountOwners = users.filter((user) =>
    Array.from(accountOwnerRoles).some((role) => hasRole(user, role))
  );
  const salesHeads = users.filter((user) =>
    Array.from(salesHeadRoles).some((role) => hasRole(user, role))
  );
  const rsmUsers = users.filter((user) => hasRole(user, "RSM"));
  const rdHeads = users.filter((user) => hasRole(user, "R&D Head"));
  const technicalOwners = users.filter((user) =>
    Array.from(technicalOwnerRoles).some((role) => hasRole(user, role))
  );
  const missingSetup = accountOwners.length === 0 || salesHeads.length === 0;
  const coverageOptions = Array.from(
    new Set([
      ...INDIAN_STATES_AND_UTS,
      ...regions.map((region) => region.region_name),
      ...selectedRegionsCovered
    ])
  ).sort((a, b) => a.localeCompare(b));
  const showOtherCropFocus = selectedCropFocus.includes("Other");

  if (legalApprovalOnly) {
    return (
      <form action={action} className="space-y-6">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-slate-950">
            MOU legal approval
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review the MOU file and update only the legal approval status.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FileUploadField
              currentValue={institution?.mou_agreement_link}
              kind="document"
              label="MoU agreement file"
              name="mou_agreement_link"
            />
            <SelectField
              defaultValue={institution?.mou_approval_status ?? "Pending"}
              label="MOU legal approval"
              name="mou_approval_status"
              options={legalApprovalStatusOptions}
            />
            <div className="md:col-span-2">
              <TextareaField
                defaultValue={institution?.mou_hr_legal_comments}
                label="HR & Legal comments"
                name="mou_hr_legal_comments"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href={cancelHref}
          >
            Cancel
          </Link>
          <SubmitButton />
        </div>
      </form>
    );
  }

  return (
    <form
      action={action}
      className="space-y-6"
      onChange={() => {
        if (clientError) {
          setClientError(null);
        }
      }}
      onSubmit={(event) => {
        setClientError(null);
        const formData = new FormData(event.currentTarget);
        const requiredFields = [
          ["organization_name", "Organization name is required."],
          ["organization_type", "Organization type is required."],
          ["institution_status", "Institution status is required."],
          ["main_contact_person", "Main contact person is required."],
          ["main_contact_number", "Main contact number is required."],
          ["account_owner_user_id", "Select an account owner."],
          ["sales_head_user_id", "Select a Sales Head."],
          ["primary_state", "Primary state is required."],
          ["opportunity_type", "Opportunity type is required."],
          ["next_action_date", "Next action date is required."],
          ["priority", "Priority is required."]
        ] as const;

        for (const [field, message] of requiredFields) {
          if (!String(formData.get(field) ?? "").trim()) {
            event.preventDefault();
            setClientError(message);
            return;
          }
        }

        if (
          formData.getAll("crop_focus").includes("Other") &&
          !String(formData.get("other_crop_focus") ?? "").trim()
        ) {
          event.preventDefault();
          setClientError("Enter other crop focus when crop focus includes Other.");
        }
      }}
    >
      {clientError || error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {clientError ?? error}
        </div>
      ) : null}

      {missingSetup ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          Please create internal users before adding institutions. Account Owner
          needs Sales Head, RSM, Salesperson, or Admin; Sales Head needs Sales
          Head or Admin.
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Organization profile
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SectorSelect defaultValue={institution?.business_sector} />
          {institution ? (
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">
                Institution code
              </p>
              <p className="min-h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                {institution.institution_code}
              </p>
            </div>
          ) : null}
          <Field
            defaultValue={institution?.organization_name}
            label="Organization name"
            name="organization_name"
            required
          />
          <SelectField
            defaultValue={
              institution?.organization_type ?? defaultOrganizationType
            }
            label="Organization type"
            name="organization_type"
            options={organizationTypeOptions}
            required
          />
          <Field
            defaultValue={institution?.website}
            label="Website"
            name="website"
            type="url"
          />
          <SelectField
            defaultValue={
              institution?.institution_status ?? defaultInstitutionStatus
            }
            label="Institution status"
            name="institution_status"
            options={institutionStatusOptions}
            required
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Main contact
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field
            defaultValue={institution?.main_contact_person}
            label="Main contact person"
            name="main_contact_person"
            required
          />
          <Field
            defaultValue={institution?.main_contact_designation}
            label="Main contact designation"
            name="main_contact_designation"
          />
          <Field
            defaultValue={institution?.main_contact_number}
            label="Main contact number"
            name="main_contact_number"
            required
            type="tel"
          />
          <Field
            defaultValue={institution?.main_contact_email}
            label="Main contact email"
            name="main_contact_email"
            type="email"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Ownership
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <UserSelectField
            defaultValue={institution?.account_owner_user_id}
            label="Account Owner"
            name="account_owner_user_id"
            options={accountOwners}
            required
          />
          <UserSelectField
            defaultValue={institution?.sales_head_user_id}
            label="Sales Head"
            name="sales_head_user_id"
            options={salesHeads}
            required
          />
          <UserSelectField
            defaultValue={institution?.rsm_user_id}
            label="RSM"
            name="rsm_user_id"
            options={rsmUsers}
          />
          <UserSelectField
            defaultValue={institution?.rd_head_user_id}
            label="R&D Head"
            name="rd_head_user_id"
            options={rdHeads}
          />
          <UserSelectField
            defaultValue={institution?.technical_owner_user_id}
            label="Technical Owner"
            name="technical_owner_user_id"
            options={technicalOwners}
          />
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="primary_region_id"
            >
              Primary region
            </label>
            <select
              className={inputClassName()}
              defaultValue={institution?.primary_region_id ?? ""}
              id="primary_region_id"
              name="primary_region_id"
            >
              <option value="">Select primary region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.region_name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <StateRegionMultiSelect
              label="States / regions covered"
              name="regions_covered"
              onChange={setSelectedRegionsCovered}
              options={coverageOptions}
              values={selectedRegionsCovered}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Geography and farmer base
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <StateDistrictSelect
            districtLabel="Primary district"
            districtName="districts_covered"
            districtValue={primaryDistrict}
            onDistrictChange={setPrimaryDistrict}
            onStateChange={setPrimaryState}
            required
            stateLabel="Primary state"
            stateName="primary_state"
            stateValue={primaryState}
          />
          <Field
            defaultValue={institution?.key_operating_areas}
            label="Key operating areas"
            name="key_operating_areas"
          />
          <Field
            defaultValue={institution?.farmer_base_count}
            label="Farmer base count"
            name="farmer_base_count"
            type="number"
          />
          <SelectField
            defaultValue={institution?.farmer_relationship_type}
            label="Farmer relationship type"
            name="farmer_relationship_type"
            options={farmerRelationshipTypeOptions}
            placeholder="Select relationship type"
          />
          <Field
            defaultValue={institution?.approx_acreage_covered}
            label="Approx acreage covered"
            name="approx_acreage_covered"
            type="number"
          />
          <div className="md:col-span-2">
            <CropMultiSelect
              label="Crop focus"
              name="crop_focus"
              onChange={setSelectedCropFocus}
              values={selectedCropFocus}
            />
          </div>
          {showOtherCropFocus ? (
            <CustomCropFields
              defaultValue={institution?.other_crop_focus}
              name="other_crop_focus"
              required
            />
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Opportunity
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField
            defaultValue={institution?.opportunity_type ?? defaultOpportunityType}
            label="Opportunity type"
            name="opportunity_type"
            options={opportunityTypeOptions}
            required
          />
          <SelectField
            defaultValue={institution?.expected_commercial_model}
            label="Expected commercial model"
            name="expected_commercial_model"
            options={expectedCommercialModelOptions}
            placeholder="Select commercial model"
          />
          <SelectField
            defaultValue={institution?.priority ?? defaultPriority}
            label="Priority"
            name="priority"
            options={priorityOptions}
            required
          />
          <Field
            defaultValue={institution?.expected_close_month}
            label="Expected close month"
            name="expected_close_month"
            type="month"
          />
          <TextareaField
            defaultValue={institution?.current_need_or_pain_point}
            label="Current need or pain point"
            name="current_need_or_pain_point"
          />
          <TextareaField
            defaultValue={institution?.jiva_use_case}
            label="Jiva use case"
            name="jiva_use_case"
          />
          <Field
            defaultValue={institution?.pilot_potential_farmers}
            label="Pilot potential farmers"
            name="pilot_potential_farmers"
            type="number"
          />
          <Field
            defaultValue={institution?.pilot_potential_acres}
            label="Pilot potential acres"
            name="pilot_potential_acres"
            type="number"
          />
          <Field
            defaultValue={institution?.total_scale_up_potential_devices}
            label="Total scale-up potential devices"
            name="total_scale_up_potential_devices"
            type="number"
          />
          <Field
            defaultValue={institution?.total_scale_up_potential_farmers}
            label="Total scale-up potential farmers"
            name="total_scale_up_potential_farmers"
            type="number"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Meetings and material sharing
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field
            defaultValue={institution?.first_meeting_date}
            label="First meeting date"
            name="first_meeting_date"
            type="date"
          />
          <Field
            defaultValue={institution?.last_meeting_date}
            label="Last meeting date"
            name="last_meeting_date"
            type="date"
          />
          <Field
            defaultValue={institution?.next_action_date ?? defaultNextActionDate()}
            label="Next action date"
            name="next_action_date"
            required
            type="date"
          />
          <SelectField
            defaultValue={institution?.management_involvement_required}
            label="Management involvement required"
            name="management_involvement_required"
            options={involvementStatusOptions}
            placeholder="Select involvement"
          />
          <SelectField
            defaultValue={institution?.rd_head_involvement_required}
            label="R&D Head involvement required"
            name="rd_head_involvement_required"
            options={rdInvolvementStatusOptions}
            placeholder="Select R&D involvement"
          />
          <SelectField
            defaultValue={institution?.proposal_shared ?? defaultProposalShared}
            label="Proposal shared"
            name="proposal_shared"
            options={yesNoPendingNaOptions}
          />
          <Field
            defaultValue={institution?.proposal_shared_date}
            label="Proposal shared date"
            name="proposal_shared_date"
            type="date"
          />
          <FileUploadField
            currentValue={institution?.proposal_link}
            kind="document"
            label="Proposal file"
            name="proposal_link"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Agreements, pilot and scale-up
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField
            defaultValue={
              institution?.mou_agreement_status ?? defaultAgreementStatus
            }
            label="MoU agreement status"
            name="mou_agreement_status"
            options={agreementStatusOptions}
          />
          <FileUploadField
            currentValue={institution?.mou_agreement_link}
            kind="document"
            label="MoU agreement file"
            name="mou_agreement_link"
          />
          {canApproveLegalDocuments ? (
            <>
              <SelectField
                defaultValue={institution?.mou_approval_status ?? "Pending"}
                label="MOU legal approval"
                name="mou_approval_status"
                options={legalApprovalStatusOptions}
              />
              <div className="md:col-span-2">
                <label
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                  htmlFor="mou_hr_legal_comments"
                >
                  HR & Legal comments
                </label>
                <textarea
                  className={textareaClassName()}
                  defaultValue={institution?.mou_hr_legal_comments ?? ""}
                  id="mou_hr_legal_comments"
                  name="mou_hr_legal_comments"
                />
              </div>
            </>
          ) : null}
          <Field
            defaultValue={institution?.corporate_po_reference}
            label="Corporate PO reference"
            name="corporate_po_reference"
          />
          <SelectField
            defaultValue={
              institution?.overall_pilot_status ?? defaultOverallPilotStatus
            }
            label="Overall pilot status"
            name="overall_pilot_status"
            options={overallPilotStatusOptions}
          />
          <SelectField
            defaultValue={institution?.scale_up_status ?? defaultScaleUpStatus}
            label="Scale-up status"
            name="scale_up_status"
            options={scaleUpStatusOptions}
          />
          <Field
            defaultValue={institution?.scale_up_next_step}
            label="Scale-up next step"
            name="scale_up_next_step"
          />
          <TextareaField
            defaultValue={institution?.overall_pilot_result_summary}
            label="Overall pilot result summary"
            name="overall_pilot_result_summary"
          />
          <TextareaField
            defaultValue={institution?.support_required}
            label="Support required"
            name="support_required"
          />
          <TextareaField
            defaultValue={institution?.remarks}
            label="Remarks"
            name="remarks"
          />
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
        <SubmitButton disabled={missingSetup} />
      </div>
    </form>
  );
}
