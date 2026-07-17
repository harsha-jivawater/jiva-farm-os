import { describe, expect, it } from "vitest";
import { normalizeImportDate } from "@/lib/csv/import-utils";

describe("CSV import dates", () => {
  it("normalizes MM-DD-YYYY dates to ISO for Postgres", () => {
    expect(normalizeImportDate("07-17-2026", "Stock entry date")).toEqual({
      error: null,
      value: "2026-07-17"
    });
  });

  it("keeps already-normalized ISO dates", () => {
    expect(normalizeImportDate("2026-07-17", "Stock entry date")).toEqual({
      error: null,
      value: "2026-07-17"
    });
  });

  it("returns a friendly error for DD-MM-YYYY values", () => {
    expect(normalizeImportDate("17-07-2026", "Stock entry date")).toEqual({
      error:
        "Stock entry date looks like DD-MM-YYYY. Use MM-DD-YYYY, for example 07-17-2026.",
      value: null
    });
  });
});
