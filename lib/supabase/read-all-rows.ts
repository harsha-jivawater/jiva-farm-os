import type { PostgrestError } from "@supabase/supabase-js";

type Page<T> = { data: T[] | null; error: PostgrestError | null };
type PagedQuery<T> = { range(from: number, to: number): PromiseLike<Page<T>> };

// Callers must order by a unique key (or append it as a tie-breaker).
// Keep each request within the configured PostgREST 1,000-row maximum.
// Never return a partial set on failure: it would produce misleading totals.
export async function readAllRows<T>(query: PagedQuery<T>): Promise<Page<T>> {
  const pageSize = 1_000;
  const rows: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await query.range(offset, offset + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < pageSize) return { data: rows, error: null };
  }
}
