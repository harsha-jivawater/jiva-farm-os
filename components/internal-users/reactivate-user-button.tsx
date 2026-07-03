"use client";

import { useFormStatus } from "react-dom";
import { RotateCcw } from "lucide-react";

type ReactivateUserButtonProps = {
  action: () => void | Promise<void>;
  message: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      disabled={pending}
      type="submit"
    >
      <RotateCcw className="h-4 w-4" aria-hidden="true" />
      {pending ? "Reactivating..." : "Reactivate User"}
    </button>
  );
}

export function ReactivateUserButton({
  action,
  message
}: ReactivateUserButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      <SubmitButton />
    </form>
  );
}
