type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  description: string;
};

export function PageHeader({ title, eyebrow, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {eyebrow ? (
        <p className="mb-2 text-sm font-medium text-brand-700">{eyebrow}</p>
      ) : null}
      <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
        {description}
      </p>
    </div>
  );
}
