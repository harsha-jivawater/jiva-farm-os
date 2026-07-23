import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeImportDate, parseCsv } from "@/lib/csv/import-utils";
import { farmerLeadImportColumns } from "@/lib/farmer-leads/import-columns";

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

describe("CSV import parser", () => {
  it("keeps business sector in the farmer lead template as optional metadata", () => {
    const template = readFileSync(
      join(process.cwd(), "public/templates/farmer-leads-import-template.csv"),
      "utf8"
    );
    const parsed = parseCsv(template);
    const businessSectorColumn = farmerLeadImportColumns.find(
      (column) => column.key === "business_sector"
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.headers).toContain("business_sector");
    expect(businessSectorColumn).not.toHaveProperty("required");
  });

  it("ignores harmless trailing blank header columns", () => {
    const parsed = parseCsv("farmer_name,mobile_number,remarks,\nA,9876543210,ok,\n");

    expect(parsed.errors).toEqual([]);
    expect(parsed.headers).toEqual(["farmer_name", "mobile_number", "remarks"]);
    expect(parsed.records).toEqual([
      {
        farmer_name: "A",
        mobile_number: "9876543210",
        remarks: "ok"
      }
    ]);
  });

  it("still rejects blank headers between named columns", () => {
    const parsed = parseCsv("farmer_name,,mobile_number\nA,,9876543210\n");

    expect(parsed.errors).toContain("CSV header row has a blank column name.");
  });
});
