"use client";

import { useFormStatus } from "react-dom";
import { LoadingSpinner } from "@/components/loading-state";

type LoginSubmitButtonProps = {
  isConfigured: boolean;
};

export function LoginSubmitButton({ isConfigured }: LoginSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = !isConfigured || pending;

  return (
    <button
      aria-busy={pending}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={isDisabled}
      type="submit"
    >
      {pending ? (
        <>
          <LoadingSpinner className="h-4 w-4" label="Signing in" />
          Signing in...
        </>
      ) : (
        "Sign in"
      )}
    </button>
  );
}
