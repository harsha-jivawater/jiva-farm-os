"use client";

import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

type DeletePlannedVisitButtonProps = {
  action: () => void | Promise<void>;
  visitLabel: string;
};

function SubmitButton({ visitLabel }: { visitLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      disabled={pending}
      type="submit"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      {pending ? "Deleting..." : `Delete ${visitLabel}`}
    </button>
  );
}

export function DeletePlannedVisitButton({
  action,
  visitLabel
}: DeletePlannedVisitButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete ${visitLabel}? This removes the planned visit from the monitoring plan.`
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <SubmitButton visitLabel={visitLabel} />
    </form>
  );
}
