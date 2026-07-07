function cleanLocationFilter(value: string) {
  return value.replace(/[,%()]/g, " ").trim();
}

export function locationFilterPattern(value: string) {
  const cleaned = cleanLocationFilter(value);
  return cleaned ? `%${cleaned}%` : "";
}

type QueryWithIlike<T> = {
  ilike(column: string, pattern: string): T;
};

export function applyLocationFilter<T extends QueryWithIlike<T>>(
  query: T,
  column: string,
  value: string
) {
  const pattern = locationFilterPattern(value);
  return pattern ? query.ilike(column, pattern) : query;
}
