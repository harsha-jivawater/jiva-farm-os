import { LockKeyhole } from "lucide-react";

type AccessDeniedProps = {
  message?: string;
};

export function AccessDenied({ message }: AccessDeniedProps) {
  return (
    <section className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
          <LockKeyhole className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-slate-950">
            Access denied
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {message ??
              "Your role does not have access to this part of Jiva Farm Devices OS."}
          </p>
        </div>
      </div>
    </section>
  );
}
