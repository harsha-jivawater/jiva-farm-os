"use client";

import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

type DeleteRecordButtonProps = {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  label: string;
  pendingLabel?: string;
  reasonLabel?: string;
  reasonPlaceholder?: string;
};

function SubmitButton({
  label,
  pendingLabel
}: Pick<DeleteRecordButtonProps, "label" | "pendingLabel">) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:w-auto"
      disabled={pending}
      type="submit"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      {pending ? pendingLabel ?? "Deleting..." : label}
    </button>
  );
}

export function DeleteRecordButton({
  action,
  confirmMessage,
  label,
  pendingLabel,
  reasonLabel = "Delete reason",
  reasonPlaceholder = "Briefly explain why this record is being deleted"
}: DeleteRecordButtonProps) {
  return (
    <form
      className="space-y-3"
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-red-950">
          {reasonLabel}
        </span>
        <textarea
          className="min-h-20 w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
          name="deletion_reason"
          placeholder={reasonPlaceholder}
          required
        />
      </label>
      <SubmitButton label={label} pendingLabel={pendingLabel} />
    </form>
  );
}
