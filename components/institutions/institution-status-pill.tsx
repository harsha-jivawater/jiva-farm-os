const statusStyles: Record<string, string> = {
  "Active Account": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Scale-up Order Received": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Scale-up Installation Started":
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Pilot Approved": "border-blue-200 bg-blue-50 text-blue-700",
  "Pilot Installed": "border-blue-200 bg-blue-50 text-blue-700",
  "Pilot Monitoring Active": "border-blue-200 bg-blue-50 text-blue-700",
  "Pilot Proposal Shared": "border-amber-200 bg-amber-50 text-amber-800",
  Parked: "border-slate-200 bg-slate-100 text-slate-700",
  Lost: "border-red-200 bg-red-50 text-red-700"
};

export function InstitutionStatusPill({ status }: { status: string }) {
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
