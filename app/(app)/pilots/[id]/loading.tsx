import { PageHeader } from "@/components/page-header";

export default function PilotDetailLoading() {
  return (
    <section>
      <PageHeader
        eyebrow="R&D and field validation"
        title="Loading Pilot"
        description="Opening the pilot record and related monitoring details."
      />
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              key={index}
            >
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-5 w-32 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
