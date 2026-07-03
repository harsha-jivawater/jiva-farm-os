const statusStyles: Record<string, string> = {
  "Monitoring Active": "border-blue-200 bg-blue-50 text-blue-700",
  "Device Installed": "border-blue-200 bg-blue-50 text-blue-700",
  "Final Report Reviewed": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Scale-up Recommended":
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Closed - Successful":
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Visit Report Pending": "border-amber-200 bg-amber-50 text-amber-800",
  "Final Report Pending": "border-amber-200 bg-amber-50 text-amber-800",
  "Closed - Failed": "border-red-200 bg-red-50 text-red-700",
  Parked: "border-slate-200 bg-slate-100 text-slate-700",
  Cancelled: "border-slate-200 bg-slate-100 text-slate-700"
};

export function PilotStatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        statusStyles[status] ?? "border-slate-200 bg-white text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}
