export default function KpiDashboardLoading() {
  return (
    <section>
      <div className="h-5 w-32 rounded-md bg-slate-200" />
      <div className="mt-3 h-10 w-64 rounded-md bg-slate-200" />
      <div className="mt-3 h-5 w-96 max-w-full rounded-md bg-slate-200" />
      <div className="mt-6 h-28 animate-pulse rounded-lg border border-slate-200 bg-white" />
      <div className="mt-6 space-y-8">
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <div key={sectionIndex}>
            <div className="h-6 w-48 rounded-md bg-slate-200" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((__, cardIndex) => (
                <div
                  className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white"
                  key={cardIndex}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
