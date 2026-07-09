import Link from "next/link";
import type { ReactNode } from "react";
import { formatDisplayDateTime } from "@/lib/date-utils";

export type ActivityTimelineItem = {
  actor?: string | null;
  category?: string;
  date: string | null | undefined;
  description?: ReactNode;
  href?: string;
  title: string;
};

type ActivityTimelineProps = {
  emptyMessage?: string;
  items: ActivityTimelineItem[];
  limit?: number;
  subtitle?: string;
  title?: string;
};

export function ActivityTimeline({
  emptyMessage = "No activity recorded yet.",
  items,
  limit = 10,
  subtitle = "Key actions and history for this record.",
  title = "Activity Timeline"
}: ActivityTimelineProps) {
  const sortedItems = [...items]
    .filter((item) => Boolean(item.date))
    .sort((a, b) => {
      const left = a.date ? new Date(a.date).getTime() : 0;
      const right = b.date ? new Date(b.date).getTime() : 0;
      return right - left;
    });
  const visibleItems = sortedItems.slice(0, limit);
  const hasMore = sortedItems.length > visibleItems.length;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      {visibleItems.length ? (
        <div className="mt-5 space-y-4">
          <ol className="space-y-4">
            {visibleItems.map((item, index) => (
              <li className="flex gap-3" key={`${item.title}-${item.date}-${index}`}>
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {item.href ? (
                          <Link
                            className="text-brand-700 hover:text-brand-800"
                            href={item.href}
                          >
                            {item.title}
                          </Link>
                        ) : (
                          item.title
                        )}
                      </p>
                      {item.description ? (
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      ) : null}
                      {item.actor ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {item.actor}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-slate-500 sm:justify-end">
                      {item.category ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-600">
                          {item.category}
                        </span>
                      ) : null}
                      <time dateTime={item.date ?? undefined}>
                        {formatDisplayDateTime(item.date)}
                      </time>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          {hasMore ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Showing latest activity.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}
