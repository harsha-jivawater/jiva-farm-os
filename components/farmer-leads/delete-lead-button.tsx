"use client";

import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

type DeleteLeadButtonProps = {
  action: () => void | Promise<void>;
};

function SubmitDeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:w-auto"
      disabled={pending}
      type="submit"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      {pending ? "Deleting..." : "Delete lead"}
    </button>
  );
}

export function DeleteLeadButton({ action }: DeleteLeadButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Delete this farmer lead?")) {
          event.preventDefault();
        }
      }}
    >
      <SubmitDeleteButton />
    </form>
  );
}
