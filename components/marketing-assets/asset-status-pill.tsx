const statusClasses: Record<string, string> = {
  Archived: "border-slate-200 bg-slate-100 text-slate-700",
  "Changes Requested": "border-amber-200 bg-amber-50 text-amber-800",
  Draft: "border-slate-200 bg-slate-50 text-slate-700",
  "Pending Review": "border-blue-200 bg-blue-50 text-blue-700",
  Published: "border-emerald-200 bg-emerald-50 text-emerald-800"
};

export function AssetStatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        statusClasses[status] ?? statusClasses.Draft
      }`}
    >
      {status}
    </span>
  );
}

