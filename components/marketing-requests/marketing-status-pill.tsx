const statusClassNames: Record<string, string> = {
  Accepted: "border-sky-200 bg-sky-50 text-sky-700",
  Cancelled: "border-slate-200 bg-slate-100 text-slate-600",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Corrections Requested": "border-amber-200 bg-amber-50 text-amber-700",
  Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Draft Shared": "border-violet-200 bg-violet-50 text-violet-700",
  "In Progress": "border-blue-200 bg-blue-50 text-blue-700",
  "Needs Clarification": "border-orange-200 bg-orange-50 text-orange-700",
  Requested: "border-slate-200 bg-white text-slate-700"
};

export function MarketingStatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${
        statusClassNames[status] ?? statusClassNames.Requested
      }`}
    >
      {status}
    </span>
  );
}

export function PriorityPill({ priority }: { priority: string }) {
  const className =
    priority === "Urgent" || priority === "High"
      ? "border-red-200 bg-red-50 text-red-700"
      : priority === "Low"
      ? "border-slate-200 bg-slate-50 text-slate-600"
      : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {priority}
    </span>
  );
}
