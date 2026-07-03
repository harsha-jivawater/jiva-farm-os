"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import {
  decisionRoleOptions,
  departmentOptions,
  influenceLevelOptions
} from "@/lib/institutions/options";
import type { InstitutionContact } from "@/lib/institutions/types";

type ContactFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
  compact?: boolean;
  contact?: InstitutionContact;
};

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function textareaClassName() {
  return "min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
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
      {pending ? "Saving..." : compact ? "Add contact" : "Save contact"}
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

function SelectField({
  defaultValue,
  label,
  name,
  options,
  placeholder
}: {
  defaultValue?: string | null;
  label: string;
  name: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder: string;
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
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ContactForm({
  action,
  cancelHref,
  compact = false,
  contact
}: ContactFormProps) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          defaultValue={contact?.contact_name}
          label="Contact name"
          name="contact_name"
          required
        />
        <Field
          defaultValue={contact?.designation}
          label="Designation"
          name="designation"
        />
        <SelectField
          defaultValue={contact?.department}
          label="Department"
          name="department"
          options={departmentOptions}
          placeholder="Select department"
        />
        <Field defaultValue={contact?.phone} label="Phone" name="phone" />
        <Field
          defaultValue={contact?.email}
          label="Email"
          name="email"
          type="email"
        />
        <SelectField
          defaultValue={contact?.influence_level}
          label="Influence level"
          name="influence_level"
          options={influenceLevelOptions}
          placeholder="Select influence level"
        />
        <SelectField
          defaultValue={contact?.decision_role}
          label="Decision role"
          name="decision_role"
          options={decisionRoleOptions}
          placeholder="Select decision role"
        />
      </div>

      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor="relationship_notes"
        >
          Relationship notes
        </label>
        <textarea
          className={textareaClassName()}
          defaultValue={contact?.relationship_notes ?? ""}
          id="relationship_notes"
          name="relationship_notes"
        />
      </div>

      <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 md:grid-cols-2">
        <label className="flex items-center gap-3">
          <input
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            defaultChecked={contact?.is_primary_contact ?? false}
            name="is_primary_contact"
            type="checkbox"
          />
          Mark as primary contact
        </label>
        <label className="flex items-center gap-3">
          <input
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            name="update_institution_main_contact"
            type="checkbox"
          />
          Update institution main contact
        </label>
      </div>

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
