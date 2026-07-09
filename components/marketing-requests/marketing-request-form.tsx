"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Save } from "lucide-react";
import {
  marketingRequestPriorityOptions,
  marketingRequestTypeOptions,
  socialMediaPlatformOptions
} from "@/lib/marketing-requests/options";
import type {
  MarketingRequest,
  RegionOption,
  RelatedOption
} from "@/lib/marketing-requests/types";

type MarketingRequestFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  dealers: RelatedOption[];
  error?: string | null;
  farmerLeads: RelatedOption[];
  institutions: RelatedOption[];
  pilots: RelatedOption[];
  regions: RegionOption[];
  request?: MarketingRequest;
};

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
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
      {pending ? "Saving..." : "Save request"}
    </button>
  );
}

function Field({
  label,
  name,
  defaultValue,
  helper,
  required = false,
  type = "text"
}: {
  defaultValue?: string | null;
  helper?: string;
  label: string;
  name: string;
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
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function TextAreaField({
  label,
  name,
  defaultValue,
  helper,
  required = false
}: {
  defaultValue?: string | null;
  helper?: string;
  label: string;
  name: string;
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
        className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        defaultValue={defaultValue ?? ""}
        id={name}
        name={name}
        required={required}
      />
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
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

function RelatedSelect({
  defaultValue,
  label,
  name,
  options
}: {
  defaultValue?: string | null;
  label: string;
  name: string;
  options: RelatedOption[];
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
      >
        <option value="">Not linked</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.detail ? `${option.label} - ${option.detail}` : option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Section({
  children,
  description,
  title
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function MarketingRequestForm({
  action,
  cancelHref,
  dealers,
  error,
  farmerLeads,
  institutions,
  pilots,
  regions,
  request
}: MarketingRequestFormProps) {
  return (
    <form action={action} className="space-y-6">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Section
        title="Request brief"
        description="Tell the marketing team what is needed. Heavy design files stay outside Jiva Farm OS."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            defaultValue={request?.title}
            label="Title"
            name="title"
            required
          />
          <SelectField
            defaultValue={request?.request_type ?? "Flyer"}
            label="Request type"
            name="request_type"
            options={marketingRequestTypeOptions}
            required
          />
          <SelectField
            defaultValue={request?.social_media_platform}
            label="Social media platform"
            name="social_media_platform"
            options={socialMediaPlatformOptions}
            placeholder="Only if relevant"
          />
          <Field
            defaultValue={request?.deadline_date}
            label="Deadline"
            name="deadline_date"
            required
            type="date"
          />
          <SelectField
            defaultValue={request?.priority ?? "Normal"}
            label="Priority"
            name="priority"
            options={marketingRequestPriorityOptions}
            required
          />
          <Field
            defaultValue={request?.required_size_or_format}
            label="Required size / format"
            name="required_size_or_format"
            helper="Example: A4 flyer, WhatsApp square, standee 6x3 ft."
          />
          <div className="md:col-span-2">
            <TextAreaField
              defaultValue={request?.brief}
              label="Brief"
              name="brief"
              required
            />
          </div>
          <TextAreaField
            defaultValue={request?.target_audience}
            label="Target audience"
            name="target_audience"
          />
          <TextAreaField
            defaultValue={request?.key_message}
            label="Key message"
            name="key_message"
          />
          <Field
            defaultValue={request?.reference_link}
            label="Reference link"
            name="reference_link"
            type="url"
          />
          <Field
            defaultValue={request?.campaign_or_event_name}
            label="Campaign / event name"
            name="campaign_or_event_name"
          />
        </div>
      </Section>

      <Section
        title="Related business context"
        description="Optional links help marketing understand the sales, pilot, or partner context."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="requested_for_region_id"
            >
              Related region
            </label>
            <select
              className={inputClassName()}
              defaultValue={request?.requested_for_region_id ?? ""}
              id="requested_for_region_id"
              name="requested_for_region_id"
            >
              <option value="">Not linked</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.region_name}
                </option>
              ))}
            </select>
          </div>
          <RelatedSelect
            defaultValue={request?.related_dealer_id}
            label="Related dealer"
            name="related_dealer_id"
            options={dealers}
          />
          <RelatedSelect
            defaultValue={request?.related_institution_id}
            label="Related institution"
            name="related_institution_id"
            options={institutions}
          />
          <RelatedSelect
            defaultValue={request?.related_farmer_lead_id}
            label="Related farmer lead"
            name="related_farmer_lead_id"
            options={farmerLeads}
          />
          <RelatedSelect
            defaultValue={request?.related_pilot_id}
            label="Related pilot"
            name="related_pilot_id"
            options={pilots}
          />
        </div>
      </Section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
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
