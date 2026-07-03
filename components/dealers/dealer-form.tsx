"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Save } from "lucide-react";
import { defaultNextActionDate } from "@/lib/dealers/form-data";
import {
  commercialTermsSharedOptions,
  creditTermsOptions,
  dealerAgreementStatusOptions,
  dealerStatusOptions,
  dealerTypeOptions,
  defaultCommercialTermsShared,
  defaultCreditTerms,
  defaultDealerAgreementStatus,
  defaultDealerStatus,
  defaultDealerType,
  defaultPriority,
  defaultTrainingStatus,
  existingCustomerBaseTypeOptions,
  keyCropOptions,
  priorityOptions,
  trainingStatusOptions
} from "@/lib/dealers/options";
import type { Dealer, RegionOption, UserOption } from "@/lib/dealers/types";
import { labelForRole } from "@/lib/users/options";
import { StateDistrictSelect } from "@/src/components/location/StateDistrictSelect";

type DealerFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  approvalOnly?: boolean;
  cancelHref: string;
  dealer?: Dealer;
  error?: string | null;
  regions: RegionOption[];
  users: UserOption[];
};

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
}

const dealerOwnerRoles = new Set(["Sales Head", "RSM", "Salesperson", "Admin"]);

function SubmitButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={pending || disabled}
      type="submit"
    >
      <Save className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saving..." : "Save dealer"}
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

export function DealerForm({
  action,
  approvalOnly = false,
  cancelHref,
  dealer,
  error,
  regions,
  users
}: DealerFormProps) {
  const initialCrops = useMemo(() => dealer?.key_crops ?? [], [dealer]);
  const [stateValue, setStateValue] = useState(dealer?.state ?? "");
  const [districtValue, setDistrictValue] = useState(dealer?.district ?? "");
  const [selectedCrops, setSelectedCrops] = useState<string[]>(initialCrops);
  const [clientError, setClientError] = useState<string | null>(null);
  const showOtherCrops = selectedCrops.includes("Other");
  const dealerOwners = users.filter((user) => dealerOwnerRoles.has(user.role));
  const rsmUsers = users.filter((user) => user.role === "RSM");
  const missingSetup =
    dealerOwners.length === 0 || rsmUsers.length === 0 || regions.length === 0;

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
          ["dealer_name", "Dealer name is required."],
          ["contact_number", "Contact number is required."],
          ["dealer_type", "Dealer type is required."],
          ["dealer_status", "Dealer status is required."],
          ["dealer_owner_user_id", "Select a dealer owner."],
          ["rsm_user_id", "Select an RSM for this dealer."],
          ["region_id", "Select a region for this dealer."],
          ["state", "State is required."],
          ["district", "District is required."],
          ["commercial_terms_shared", "Commercial terms shared is required."],
          ["dealer_agreement_status", "Dealer agreement status is required."],
          ["training_status", "Training status is required."],
          ["credit_terms", "Credit terms are required."],
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
          formData.get("dealer_status") === "Active Dealer" &&
          formData.get("dealer_agreement_status") !== "Signed"
        ) {
          event.preventDefault();
          setClientError(
            "Dealer cannot become Active Dealer unless the dealer agreement status is Signed."
          );
        }
      }}
    >
      <input
        name="agreement_required"
        type="hidden"
        value={dealer?.agreement_required === false ? "false" : "true"}
      />
      {approvalOnly && dealer ? (
        <>
          <input name="dealer_name" type="hidden" value={dealer.dealer_name} />
          <input name="firm_name" type="hidden" value={dealer.firm_name ?? ""} />
          <input name="contact_number" type="hidden" value={dealer.contact_number} />
          <input name="dealer_type" type="hidden" value={dealer.dealer_type} />
          <input
            name="dealer_owner_user_id"
            type="hidden"
            value={dealer.dealer_owner_user_id}
          />
          <input name="rsm_user_id" type="hidden" value={dealer.rsm_user_id} />
          <input name="region_id" type="hidden" value={dealer.region_id} />
          <input name="state" type="hidden" value={dealer.state} />
          <input name="district" type="hidden" value={dealer.district} />
          <input
            name="taluk_or_territory"
            type="hidden"
            value={dealer.taluk_or_territory ?? ""}
          />
          <input
            name="existing_customer_base_type"
            type="hidden"
            value={dealer.existing_customer_base_type ?? ""}
          />
          <input
            name="other_key_crops"
            type="hidden"
            value={dealer.other_key_crops ?? ""}
          />
          {(dealer.key_crops ?? []).map((crop) => (
            <input key={crop} name="key_crops" type="hidden" value={crop} />
          ))}
        </>
      ) : null}

      {clientError || error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {clientError ?? error}
        </div>
      ) : null}

      {missingSetup && !approvalOnly ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          Please create internal users and regions before adding dealers.
        </div>
      ) : null}

      {approvalOnly && dealer ? (
        <>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-semibold text-slate-950">
              Sales Head approval
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Update approval, onboarding status, priority, targets, and next
              action. Dealer profile fields remain with Admin/RSM ownership.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SelectField
                defaultValue={dealer.dealer_status}
                label="Dealer status"
                name="dealer_status"
                options={dealerStatusOptions}
                required
              />
              <SelectField
                defaultValue={dealer.priority ?? defaultPriority}
                label="Priority"
                name="priority"
                options={priorityOptions}
                required
              />
              <SelectField
                defaultValue={dealer.commercial_terms_shared}
                label="Commercial terms shared"
                name="commercial_terms_shared"
                options={commercialTermsSharedOptions}
                required
              />
              <SelectField
                defaultValue={dealer.dealer_agreement_status}
                label="Dealer agreement status"
                name="dealer_agreement_status"
                options={dealerAgreementStatusOptions}
                required
              />
              <SelectField
                defaultValue={dealer.training_status}
                label="Training status"
                name="training_status"
                options={trainingStatusOptions}
                required
              />
              <SelectField
                defaultValue={dealer.credit_terms}
                label="Credit terms"
                name="credit_terms"
                options={creditTermsOptions}
                required
              />
              <Field
                defaultValue={dealer.monthly_installation_target ?? 0}
                label="Monthly installation target"
                name="monthly_installation_target"
                required
                type="number"
              />
              <Field
                defaultValue={dealer.quarterly_installation_target ?? 0}
                label="Quarterly installation target"
                name="quarterly_installation_target"
                type="number"
              />
              <Field
                defaultValue={dealer.annual_installation_target ?? 0}
                label="Annual installation target"
                name="annual_installation_target"
                type="number"
              />
              <Field
                defaultValue={dealer.next_action_date ?? defaultNextActionDate()}
                label="Next action date"
                name="next_action_date"
                required
                type="date"
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
            <SubmitButton />
          </div>
        </>
      ) : (
        <>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Dealer profile
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {dealer ? (
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">
                Dealer code
              </p>
              <p className="min-h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                {dealer.dealer_code}
              </p>
            </div>
          ) : null}
          <Field
            defaultValue={dealer?.dealer_name}
            label="Dealer name"
            name="dealer_name"
            required
          />
          <Field
            defaultValue={dealer?.firm_name}
            label="Firm name"
            name="firm_name"
          />
          <Field
            defaultValue={dealer?.contact_number}
            label="Contact number"
            name="contact_number"
            required
            type="tel"
          />
          <SelectField
            defaultValue={dealer?.dealer_type ?? defaultDealerType}
            label="Dealer type"
            name="dealer_type"
            options={dealerTypeOptions}
            required
          />
          <SelectField
            defaultValue={dealer?.dealer_status ?? defaultDealerStatus}
            label="Dealer status"
            name="dealer_status"
            options={dealerStatusOptions}
            required
          />
          <SelectField
            defaultValue={dealer?.priority ?? defaultPriority}
            label="Priority"
            name="priority"
            options={priorityOptions}
            required
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Territory ownership
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="dealer_owner_user_id"
            >
              Dealer Owner
            </label>
            <select
              className={inputClassName()}
              defaultValue={dealer?.dealer_owner_user_id ?? ""}
              disabled={dealerOwners.length === 0}
              id="dealer_owner_user_id"
              name="dealer_owner_user_id"
              required
            >
              <option value="">Select dealer owner</option>
              {dealerOwners.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} · {labelForRole(user.role)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="rsm_user_id"
            >
              RSM
            </label>
            <select
              className={inputClassName()}
              defaultValue={dealer?.rsm_user_id ?? ""}
              disabled={rsmUsers.length === 0}
              id="rsm_user_id"
              name="rsm_user_id"
              required
            >
              <option value="">Select RSM</option>
              {rsmUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} · {labelForRole(user.role)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="region_id"
            >
              Region
            </label>
            <select
              className={inputClassName()}
              defaultValue={dealer?.region_id ?? ""}
              disabled={regions.length === 0}
              id="region_id"
              name="region_id"
              required
            >
              <option value="">Select region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.region_name}
                </option>
              ))}
            </select>
          </div>

          <StateDistrictSelect
            districtValue={districtValue}
            onDistrictChange={setDistrictValue}
            onStateChange={setStateValue}
            stateValue={stateValue}
            required
          />

          <Field
            defaultValue={dealer?.taluk_or_territory}
            label="Taluk or territory"
            name="taluk_or_territory"
            required
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Crops and customer base
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-medium text-slate-700">
              Key crops
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {keyCropOptions.map((crop) => (
                <label
                  className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700"
                  key={crop.value}
                >
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    defaultChecked={initialCrops.includes(crop.value)}
                    name="key_crops"
                    onChange={(event) => {
                      setSelectedCrops((current) =>
                        event.target.checked
                          ? [...current, crop.value]
                          : current.filter((value) => value !== crop.value)
                      );
                    }}
                    type="checkbox"
                    value={crop.value}
                  />
                  {crop.label}
                </label>
              ))}
            </div>
          </div>

          {showOtherCrops ? (
            <Field
              defaultValue={dealer?.other_key_crops}
              label="Other key crops"
              name="other_key_crops"
              required
            />
          ) : null}

          <SelectField
            defaultValue={dealer?.existing_customer_base_type}
            label="Existing customer base"
            name="existing_customer_base_type"
            options={existingCustomerBaseTypeOptions}
            placeholder="Select customer base"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Commercial and onboarding
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField
            defaultValue={
              dealer?.commercial_terms_shared ?? defaultCommercialTermsShared
            }
            label="Commercial terms shared"
            name="commercial_terms_shared"
            options={commercialTermsSharedOptions}
            required
          />
          <SelectField
            defaultValue={
              dealer?.dealer_agreement_status ?? defaultDealerAgreementStatus
            }
            label="Dealer agreement status"
            name="dealer_agreement_status"
            options={dealerAgreementStatusOptions}
            required
          />
          <SelectField
            defaultValue={dealer?.training_status ?? defaultTrainingStatus}
            label="Training status"
            name="training_status"
            options={trainingStatusOptions}
            required
          />
          <SelectField
            defaultValue={dealer?.credit_terms ?? defaultCreditTerms}
            label="Credit terms"
            name="credit_terms"
            options={creditTermsOptions}
            required
          />
          <Field
            defaultValue={dealer?.next_action_date ?? defaultNextActionDate()}
            label="Next action date"
            name="next_action_date"
            required
            type="date"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">Targets</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field
            defaultValue={dealer?.monthly_installation_target ?? 0}
            label="Monthly installation target"
            name="monthly_installation_target"
            type="number"
          />
          <Field
            defaultValue={dealer?.quarterly_installation_target ?? 0}
            label="Quarterly installation target"
            name="quarterly_installation_target"
            type="number"
          />
          <Field
            defaultValue={dealer?.annual_installation_target ?? 0}
            label="Annual installation target"
            name="annual_installation_target"
            type="number"
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
        </>
      )}
    </form>
  );
}
