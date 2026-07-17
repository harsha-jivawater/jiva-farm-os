export type CsvRecord = Record<string, string>;

export type CsvParseResult = {
  headers: string[];
  records: CsvRecord[];
  errors: string[];
};

export const MAX_IMPORT_ROWS = 500;

export function normalizeCsvHeader(header: string) {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function parseCsv(text: string): CsvParseResult {
  const rows: string[][] = [];
  const errors: string[] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(current.trim());
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (inQuotes) {
    errors.push("CSV has an unclosed quoted value.");
  }

  row.push(current.trim());
  rows.push(row);

  const nonBlankRows = rows.filter((values) =>
    values.some((value) => value.trim() !== "")
  );

  if (nonBlankRows.length === 0) {
    return { headers: [], records: [], errors: ["CSV file is empty."] };
  }

  const headers = nonBlankRows[0].map(normalizeCsvHeader);

  if (headers.some((header) => !header)) {
    errors.push("CSV header row has a blank column name.");
  }

  const duplicateHeaders = headers.filter(
    (header, index) => headers.indexOf(header) !== index
  );

  if (duplicateHeaders.length > 0) {
    errors.push(
      `CSV has duplicate headers: ${Array.from(new Set(duplicateHeaders)).join(", ")}.`
    );
  }

  const records = nonBlankRows.slice(1).map((values) => {
    const record: CsvRecord = {};

    headers.forEach((header, index) => {
      record[header] = values[index]?.trim() ?? "";
    });

    return record;
  });

  if (records.length > MAX_IMPORT_ROWS) {
    errors.push(`Import is limited to ${MAX_IMPORT_ROWS} rows at a time.`);
  }

  return { headers, records, errors };
}

export function requiredHeaderErrors(
  headers: string[],
  requiredHeaders: readonly string[]
) {
  return requiredHeaders
    .filter((header) => !headers.includes(header))
    .map((header) => `Missing required CSV header: ${header}.`);
}

export function parseBoolean(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  return ["true", "yes", "y", "1", "on"].includes(normalized);
}

export function parseNumber(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function paddedDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function isValidCalendarDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function normalizeImportDate(
  value: string | null | undefined,
  fieldLabel = "Date"
) {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    return { error: null, value: null };
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    const [, yearValue, monthValue, dayValue] = isoMatch;
    const year = Number(yearValue);
    const month = Number(monthValue);
    const day = Number(dayValue);

    return isValidCalendarDate(year, month, day)
      ? { error: null, value: trimmed }
      : {
          error: `${fieldLabel} is not a valid calendar date. Use MM-DD-YYYY, for example 07-17-2026.`,
          value: null
        };
  }

  const usMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);

  if (!usMatch) {
    return {
      error: `${fieldLabel} must use MM-DD-YYYY, for example 07-17-2026.`,
      value: null
    };
  }

  const [, monthValue, dayValue, yearValue] = usMatch;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);

  if (month > 12 && day <= 12) {
    return {
      error: `${fieldLabel} looks like DD-MM-YYYY. Use MM-DD-YYYY, for example 07-17-2026.`,
      value: null
    };
  }

  if (!isValidCalendarDate(year, month, day)) {
    return {
      error: `${fieldLabel} is not a valid calendar date. Use MM-DD-YYYY, for example 07-17-2026.`,
      value: null
    };
  }

  return {
    error: null,
    value: `${year}-${paddedDatePart(month)}-${paddedDatePart(day)}`
  };
}

export function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function generateImportCode(prefix: string) {
  const stamp = new Date()
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(".", "")
    .slice(0, 15);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `${prefix}-${stamp}-${suffix}`;
}
