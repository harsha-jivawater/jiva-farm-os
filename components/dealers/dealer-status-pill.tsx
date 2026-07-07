import { simplifiedDealerStatus } from "@/lib/dealers/options";

type DealerStatusPillProps = {
  status: string;
};

const statusClassNames: Record<string, string> = {
  Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Dormant: "border-amber-200 bg-amber-50 text-amber-700",
  Dropped: "border-red-200 bg-red-50 text-red-700",
  Onboarding: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Prospect: "border-blue-200 bg-blue-50 text-blue-700"
};

export function DealerStatusPill({ status }: DealerStatusPillProps) {
  const displayStatus = simplifiedDealerStatus(status);

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        statusClassNames[displayStatus] ??
        "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      {displayStatus}
    </span>
  );
}
