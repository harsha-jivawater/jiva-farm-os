const placeholderNames = new Set([
  "demo",
  "na",
  "n/a",
  "none",
  "not set",
  "sample",
  "test",
  "unknown"
]);

export function isPlaceholderPilotContextName(
  name: string | null | undefined
) {
  const cleaned = String(name ?? "")
    .trim()
    .toLowerCase();

  return !cleaned || placeholderNames.has(cleaned);
}

export function shortPilotContextName(name: string | null | undefined) {
  if (isPlaceholderPilotContextName(name)) {
    return null;
  }

  const cleaned = String(name ?? "")
    .replace(/\b(LLP|PVT|PRIVATE|LIMITED|LTD|INC|COMPANY|CO)\b\.?/gi, " ")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || isPlaceholderPilotContextName(cleaned)) {
    return null;
  }

  const words = cleaned
    .split(" ")
    .filter(
      (word) =>
        word.length > 1 &&
        !["and", "of", "the"].includes(word.toLowerCase())
    );

  if (words.length >= 2) {
    const acronym = words
      .slice(0, 3)
      .map((word) => word[0])
      .join("")
      .toUpperCase();

    return acronym || null;
  }

  return words[0] ?? null;
}

export function suggestedPilotNameFromContext({
  contextName,
  pilotType,
  sequence = "01"
}: {
  contextName: string | null | undefined;
  pilotType: string;
  sequence?: string;
}) {
  if (isPlaceholderPilotContextName(contextName)) {
    return null;
  }

  const baseName =
    pilotType === "Farmer Validation Pilot"
      ? String(contextName ?? "").trim()
      : shortPilotContextName(contextName);

  if (!baseName || isPlaceholderPilotContextName(baseName)) {
    return null;
  }

  return `${baseName} Pilot - ${sequence}`;
}
