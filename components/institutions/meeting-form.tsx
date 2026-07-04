"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import { todayDate } from "@/lib/institutions/form-data";
import {
  defaultMeetingMode,
  defaultMeetingOutcome,
  defaultMeetingType,
  meetingModeOptions,
  meetingOutcomeOptions,
  meetingTypeOptions
} from "@/lib/institutions/options";
import type {
  InstitutionContact,
  InstitutionMeeting,
  UserOption
} from "@/lib/institutions/types";
import { labelForRole } from "@/lib/users/options";
import { hasRole } from "@/lib/users/permissions";

type MeetingFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
  compact?: boolean;
  contacts: InstitutionContact[];
  meeting?: InstitutionMeeting;
  users: UserOption[];
};

const salesHeadRoles = new Set(["Sales Head", "Admin"]);

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function textareaClassName() {
  return "min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
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
      {pending ? "Saving..." : compact ? "Add meeting" : "Save meeting"}
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

export function MeetingForm({
  action,
  cancelHref,
  compact = false,
  contacts,
  meeting,
  users
}: MeetingFormProps) {
  const salesHeads = users.filter((user) =>
    Array.from(salesHeadRoles).some((role) => hasRole(user, role))
  );
  const rsmUsers = users.filter((user) => hasRole(user, "RSM"));
  const rdHeads = users.filter((user) => hasRole(user, "R&D Head"));
  const agronomists = users.filter((user) => hasRole(user, "Agronomist"));

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          defaultValue={meeting?.meeting_date ?? todayDate()}
          label="Meeting date"
          name="meeting_date"
          required
          type="date"
        />
        <SelectField
          defaultValue={meeting?.meeting_type ?? defaultMeetingType}
          label="Meeting type"
          name="meeting_type"
          options={meetingTypeOptions}
          required
        />
        <SelectField
          defaultValue={meeting?.meeting_mode ?? defaultMeetingMode}
          label="Meeting mode"
          name="meeting_mode"
          options={meetingModeOptions}
          required
        />
        <Field
          defaultValue={meeting?.meeting_location}
          label="Meeting location"
          name="meeting_location"
        />
        <UserSelectField
          defaultValue={meeting?.primary_internal_owner_user_id}
          label="Primary internal owner"
          name="primary_internal_owner_user_id"
          options={users}
          required
        />
        <UserSelectField
          defaultValue={meeting?.sales_head_user_id}
          label="Sales Head"
          name="sales_head_user_id"
          options={salesHeads}
        />
        <UserSelectField
          defaultValue={meeting?.rsm_user_id}
          label="RSM"
          name="rsm_user_id"
          options={rsmUsers}
        />
        <UserSelectField
          defaultValue={meeting?.rd_head_user_id}
          label="R&D Head"
          name="rd_head_user_id"
          options={rdHeads}
        />
        <UserSelectField
          defaultValue={meeting?.agronomist_user_id}
          label="Agronomist"
          name="agronomist_user_id"
          options={agronomists}
        />
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor="external_contact_id"
          >
            External contact
          </label>
          <select
            className={inputClassName()}
            defaultValue={meeting?.external_contact_id ?? ""}
            id="external_contact_id"
            name="external_contact_id"
          >
            <option value="">Select external contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.contact_name}
                {contact.designation ? ` · ${contact.designation}` : ""}
              </option>
            ))}
          </select>
        </div>
        <SelectField
          defaultValue={meeting?.outcome ?? defaultMeetingOutcome}
          label="Outcome"
          name="outcome"
          options={meetingOutcomeOptions}
          required
        />
        <Field
          defaultValue={meeting?.next_action}
          label="Next action"
          name="next_action"
        />
        <Field
          defaultValue={meeting?.next_action_date}
          label="Next action date"
          name="next_action_date"
          type="date"
        />
        <Field
          defaultValue={meeting?.notes_link}
          label="Notes link"
          name="notes_link"
          type="url"
        />
      </div>

      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor="meeting_summary"
        >
          Meeting summary
        </label>
        <textarea
          className={textareaClassName()}
          defaultValue={meeting?.meeting_summary ?? ""}
          id="meeting_summary"
          name="meeting_summary"
          required
        />
      </div>

      <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 md:grid-cols-3">
        <label className="flex items-center gap-3">
          <input
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            defaultChecked={meeting?.proposal_required ?? false}
            name="proposal_required"
            type="checkbox"
          />
          Proposal required
        </label>
        <label className="flex items-center gap-3">
          <input
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            defaultChecked={meeting?.pilot_discussed ?? false}
            name="pilot_discussed"
            type="checkbox"
          />
          Pilot discussed
        </label>
        <label className="flex items-center gap-3">
          <input
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            defaultChecked={meeting?.scale_up_discussed ?? false}
            name="scale_up_discussed"
            type="checkbox"
          />
          Scale-up discussed
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
