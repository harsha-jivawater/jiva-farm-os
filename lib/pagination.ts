export const DEFAULT_PAGE_SIZE = 50;

export function getPageNumber(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedPage = Number.parseInt(rawValue ?? "1", 10);

  if (!Number.isFinite(parsedPage) || parsedPage < 1) {
    return 1;
  }

  return parsedPage;
}

export function getPaginationRange(
  page: number,
  pageSize = DEFAULT_PAGE_SIZE
) {
  const safePage = Math.max(1, Math.floor(page));
  const from = (safePage - 1) * pageSize;

  return {
    from,
    page: safePage,
    pageSize,
    to: from + pageSize - 1
  };
}

export function getTotalPages(
  totalCount: number | null | undefined,
  pageSize = DEFAULT_PAGE_SIZE
) {
  return Math.max(1, Math.ceil((totalCount ?? 0) / pageSize));
}
