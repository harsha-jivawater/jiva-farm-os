import { PageHeader } from "@/components/page-header";

type PlaceholderPageProps = {
  title: string;
  description: string;
  checkpoints: string[];
};

export function PlaceholderPage({
  title,
  description,
  checkpoints
}: PlaceholderPageProps) {
  return (
    <section>
      <PageHeader
        eyebrow="Module placeholder"
        title={title}
        description={description}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {checkpoints.map((checkpoint) => (
          <div
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            key={checkpoint}
          >
            <p className="text-sm font-semibold text-slate-950">{checkpoint}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ready for data fields, filters, and workflow actions in the next
              build phase.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
