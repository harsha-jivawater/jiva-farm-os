import {
  followupStatusOptions,
  labelFor
} from "@/lib/follow-ups/options";

type FollowupStatusPillProps = {
  status?: string | null;
};

export function FollowupStatusPill({ status }: FollowupStatusPillProps) {
  const colorClass =
    status === "Completed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Missed" || status === "Cancelled"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "Escalated"
          ? "border-purple-200 bg-purple-50 text-purple-700"
          : status === "Rescheduled"
            ? "border-sky-200 bg-sky-50 text-sky-700"
            : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
        colorClass
      ].join(" ")}
    >
      {labelFor(status, followupStatusOptions)}
    </span>
  );
}
