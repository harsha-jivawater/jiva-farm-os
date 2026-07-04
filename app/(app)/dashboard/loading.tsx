export default function DashboardLoading() {
  return (
    <section>
      <div className="h-5 w-36 rounded-md bg-slate-200" />
      <div className="mt-3 h-10 w-52 rounded-md bg-slate-200" />
      <div className="mt-3 h-5 w-72 rounded-md bg-slate-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white"
            key={index}
          />
        ))}
      </div>
    </section>
  );
}
