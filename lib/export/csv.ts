import { formatDisplayDate } from "@/lib/date-utils";

export const CSV_EXPORT_LIMIT = 5000;

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => unknown;
};

function csvCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const text =
    typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function buildCsv<T>(columns: CsvColumn<T>[], rows: T[]) {
  const header = columns.map((column) => csvCell(column.header)).join(",");
  const body = rows.map((row) =>
    columns.map((column) => csvCell(column.value(row))).join(",")
  );

  return [header, ...body].join("\r\n");
}

export function csvResponse<T>({
  columns,
  filenameBase,
  rows
}: {
  columns: CsvColumn<T>[];
  filenameBase: string;
  rows: T[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const csv = buildCsv(columns, rows);

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Disposition": `attachment; filename="${filenameBase}-${today}.csv"`,
      "Content-Type": "text/csv; charset=utf-8"
    }
  });
}

export function exportLink(
  path: string,
  params: Record<string, string | string[] | undefined>
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          search.append(key, item);
        }
      }
    } else if (value) {
      search.set(key, value);
    }
  }

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function csvDate(value: string | null | undefined) {
  return value ? formatDisplayDate(value, "") : "";
}

export function csvDisplay(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return value;
}

export function yesNo(value: boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return value ? "Yes" : "No";
}
