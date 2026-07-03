export default function DispatchesLoading() {
  return (
    <section>
      <div className="h-7 w-36 rounded-md bg-slate-200" />
      <div className="mt-3 h-10 w-72 rounded-md bg-slate-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white"
            key={index}
          />
        ))}
      </div>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Loading dispatch records...
      </div>
    </section>
  );
}
