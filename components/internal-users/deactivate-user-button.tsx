"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { labelForRole } from "@/lib/users/options";
import type { InternalUser } from "@/lib/users/types";

type DeactivateUserButtonProps = {
  action: (formData: FormData) => void | Promise<void>;
  confirmationMessage: string;
  replacementUsers: InternalUser[];
  user: InternalUser;
};

function ConfirmButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={pending}
      type="submit"
    >
      {pending ? "Transferring..." : "Deactivate & Transfer"}
    </button>
  );
}

export function DeactivateUserButton({
  action,
  confirmationMessage,
  replacementUsers,
  user
}: DeactivateUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const eligibleUsers = useMemo(
    () =>
      replacementUsers.filter(
        (replacementUser) =>
          replacementUser.is_active && replacementUser.id !== user.id
      ),
    [replacementUsers, user.id]
  );

  return (
    <>
      <button
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        Deactivate & Transfer
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Deactivate {user.full_name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{user.email}</p>
              </div>
              <button
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form action={action} className="space-y-4 p-5">
              <input
                name="confirmation_message"
                type="hidden"
                value={confirmationMessage}
              />
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                {confirmationMessage}
              </div>

              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Replacement User
                <select
                  className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  name="replacement_user_id"
                  required
                >
                  <option value="">Select replacement</option>
                  {eligibleUsers.map((replacementUser) => (
                    <option key={replacementUser.id} value={replacementUser.id}>
                      {replacementUser.full_name} - {labelForRole(replacementUser.role)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Deactivation Reason
                <textarea
                  className="min-h-28 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  name="deactivation_reason"
                  required
                />
              </label>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <ConfirmButton />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
