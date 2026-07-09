type DateValue = Date | string | null | undefined;

const displayDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Kolkata",
  year: "numeric"
});

const displayDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Kolkata",
  year: "numeric"
});

function formatDateParts(year: string, month: string, day: string) {
  return `${day}/${month}/${year}`;
}

function dateOnlyParts(value: string) {
  return value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
}

function parseDate(value: DateValue) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDisplayDate(value: DateValue, fallback = "Not set") {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return fallback;
    }

    const parts = dateOnlyParts(trimmedValue);
    if (parts) {
      const [, year, month, day] = parts;
      return year && month && day
        ? formatDateParts(year, month, day)
        : fallback;
    }
  }

  const parsed = parseDate(value);
  return parsed ? displayDateFormatter.format(parsed) : fallback;
}

export function formatDisplayDateTime(value: DateValue, fallback = "Not set") {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return fallback;
    }

    const parts = dateOnlyParts(trimmedValue);
    if (parts) {
      const [, year, month, day] = parts;
      return year && month && day
        ? formatDateParts(year, month, day)
        : fallback;
    }
  }

  const parsed = parseDate(value);
  return parsed ? displayDateTimeFormatter.format(parsed) : fallback;
}

export function formatNullableDisplayDate(
  value: DateValue,
  fallback = "Not set"
) {
  return formatDisplayDate(value, fallback);
}

export function formatDisplayDateRange(
  start: DateValue,
  end: DateValue,
  fallback = "Not set"
) {
  const startLabel = formatDisplayDate(start, "");
  const endLabel = formatDisplayDate(end, "");

  if (!startLabel && !endLabel) {
    return fallback;
  }

  if (startLabel && endLabel) {
    return `${startLabel} to ${endLabel}`;
  }

  return startLabel || endLabel;
}
