import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { DEFAULT_PAGE_SIZE, getTotalPages } from "@/lib/pagination";

type SearchParams = Record<string, string | string[] | undefined>;

type NumberedPaginationProps = {
  basePath: string;
  excludedParams?: string[];
  label?: string;
  page: number;
  pageSize?: number;
  searchParams: SearchParams;
  totalCount: number;
};

function pageHref(
  basePath: string,
  excludedParams: string[],
  searchParams: SearchParams,
  page: number
) {
  const params = new URLSearchParams();
  const excludedParamSet = new Set(["page", ...excludedParams]);

  for (const [key, value] of Object.entries(searchParams)) {
    if (excludedParamSet.has(key) || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          params.append(key, item);
        }
      }
      continue;
    }

    if (value) {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function DisabledPageButton({
  children
}: {
  children: ReactNode;
}) {
  return (
    <span className="inline-flex h-9 min-w-9 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-400">
      {children}
    </span>
  );
}

export function NumberedPagination({
  basePath,
  excludedParams = [],
  label = "records",
  page,
  pageSize = DEFAULT_PAGE_SIZE,
  searchParams,
  totalCount
}: NumberedPaginationProps) {
  const totalPages = getTotalPages(totalCount, pageSize);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const firstVisibleRecord =
    totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleRecord = Math.min(currentPage * pageSize, totalCount);

  return (
    <nav
      aria-label={`${label} pagination`}
      className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-slate-500">
        Showing {firstVisibleRecord}-{lastVisibleRecord} of {totalCount}{" "}
        {label}
      </p>
      {totalPages > 1 ? (
        <div className="flex flex-wrap gap-2">
          {currentPage > 1 ? (
            <Link
              aria-label="Previous page"
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              href={pageHref(
                basePath,
                excludedParams,
                searchParams,
                currentPage - 1
              )}
              prefetch={false}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <DisabledPageButton>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </DisabledPageButton>
          )}
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) =>
              pageNumber === currentPage ? (
                <span
                  aria-current="page"
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-brand-600 px-3 text-sm font-semibold text-white shadow-sm"
                  key={pageNumber}
                >
                  {pageNumber}
                </span>
              ) : (
                <Link
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  href={pageHref(
                    basePath,
                    excludedParams,
                    searchParams,
                    pageNumber
                  )}
                  key={pageNumber}
                  prefetch={false}
                >
                  {pageNumber}
                </Link>
              )
          )}
          {currentPage < totalPages ? (
            <Link
              aria-label="Next page"
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              href={pageHref(
                basePath,
                excludedParams,
                searchParams,
                currentPage + 1
              )}
              prefetch={false}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <DisabledPageButton>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </DisabledPageButton>
          )}
        </div>
      ) : null}
    </nav>
  );
}
