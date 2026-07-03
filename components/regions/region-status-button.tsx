"use client";

import { useFormStatus } from "react-dom";
import { Power, RotateCcw } from "lucide-react";

type RegionStatusButtonProps = {
  action: () => void | Promise<void>;
  active: boolean;
};

function SubmitButton({ active }: { active: boolean }) {
  const { pending } = useFormStatus();
  const Icon = active ? Power : RotateCcw;

  return (
    <button
      className={[
        "inline-flex min-h-9 items-center justify-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
        active
          ? "border-red-200 text-red-700 hover:bg-red-50"
          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
      ].join(" ")}
      disabled={pending}
      type="submit"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saving..." : active ? "Deactivate" : "Reactivate"}
    </button>
  );
}

export function RegionStatusButton({
  action,
  active
}: RegionStatusButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const message = active
          ? "Deactivate this region? Existing records will remain linked."
          : "Reactivate this region?";

        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      <SubmitButton active={active} />
    </form>
  );
}
