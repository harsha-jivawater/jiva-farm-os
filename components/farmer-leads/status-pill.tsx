import { labelFor, leadStatusOptions } from "@/lib/farmer-leads/options";

type StatusPillProps = {
  status?: string | null;
};

export function StatusPill({ status }: StatusPillProps) {
  const colorClass =
    status === "Won"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Lost"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "Parked"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-sky-200 bg-sky-50 text-sky-700";

  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
        colorClass
      ].join(" ")}
    >
      {labelFor(status, leadStatusOptions)}
    </span>
  );
}
