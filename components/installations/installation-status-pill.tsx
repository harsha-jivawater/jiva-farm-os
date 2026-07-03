import {
  installationStatusOptions,
  labelFor
} from "@/lib/installations/options";

type InstallationStatusPillProps = {
  status?: string | null;
};

export function InstallationStatusPill({
  status
}: InstallationStatusPillProps) {
  const colorClass =
    status === "Verified" || status === "Closed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Installed"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : status === "Issue Reported" || status === "Cancelled"
          ? "border-red-200 bg-red-50 text-red-700"
          : status === "Follow-up Pending"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
        colorClass
      ].join(" ")}
    >
      {labelFor(status, installationStatusOptions)}
    </span>
  );
}
