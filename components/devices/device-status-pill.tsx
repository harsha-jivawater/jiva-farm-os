import { deviceStatusOptions, labelFor } from "@/lib/devices/options";

type DeviceStatusPillProps = {
  status?: string | null;
};

export function DeviceStatusPill({ status }: DeviceStatusPillProps) {
  const colorClass =
    status === "Installed at Farmer Site" || status === "Installed for Pilot"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Damaged" || status === "Lost"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "Hold" || status === "Returned"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : status === "With Dealer" || status === "With Farmer"
            ? "border-sky-200 bg-sky-50 text-sky-700"
            : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
        colorClass
      ].join(" ")}
    >
      {labelFor(status, deviceStatusOptions)}
    </span>
  );
}
