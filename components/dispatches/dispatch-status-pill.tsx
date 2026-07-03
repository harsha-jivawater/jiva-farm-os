import {
  dispatchStatusOptions,
  labelFor
} from "@/lib/dispatches/options";

type DispatchStatusPillProps = {
  status?: string | null;
};

export function DispatchStatusPill({ status }: DispatchStatusPillProps) {
  const colorClass =
    status === "Delivered" || status === "Installed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Dispatched" || status === "Approved for Dispatch"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : status === "On Hold" ||
            status === "Pending Payment Confirmation" ||
            status === "Pending Approval"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : status === "Cancelled"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
        colorClass
      ].join(" ")}
    >
      {labelFor(status, dispatchStatusOptions)}
    </span>
  );
}
