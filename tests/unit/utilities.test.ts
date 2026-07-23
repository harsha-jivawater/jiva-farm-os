import { describe, expect, it } from "vitest";
import {
  formatDisplayDate,
  formatDisplayDateRange
} from "@/lib/date-utils";
import { deriveLeadStatus } from "@/lib/farmer-leads/workflow";
import { groupPaymentLinks, type PaymentLink } from "@/lib/payment-links";
import {
  isStorageReference,
  storagePathFromReference,
  storageReferenceFromPath,
  uploadRules
} from "@/lib/uploads/config";
import {
  isSafeInternalPath,
  postLoginPathForUser
} from "@/lib/users/default-route";
import {
  isJivawaterEmail,
  normalizeInternalEmail
} from "@/lib/users/validation";
import {
  normalizeIndianMobileNumber,
  validateIndianMobileNumber
} from "@/lib/validation/mobile-number";
import { normalizeLocationKey } from "@/lib/locations/normalize";

describe("authentication input safety", () => {
  it("accepts only safe internal return paths", () => {
    expect(isSafeInternalPath("/pilots/123?tab=visits")).toBe(true);
    expect(isSafeInternalPath("https://example.com")).toBe(false);
    expect(isSafeInternalPath("//example.com")).toBe(false);
    expect(isSafeInternalPath("/login?next=/pilots")).toBe(false);
    expect(postLoginPathForUser({ role: "Viewer" }, "//example.com")).toBe(
      "/my-pending-work"
    );
  });

  it("normalizes and restricts internal email addresses", () => {
    expect(normalizeInternalEmail("  USER@JIVAWATER.COM ")).toBe(
      "user@jivawater.com"
    );
    expect(isJivawaterEmail("user@jivawater.com")).toBe(true);
    expect(isJivawaterEmail("user@gmail.com")).toBe(false);
  });
});

describe("shared workflow utilities", () => {
  it.each([
    ["9876543210", "9876543210"],
    ["+91 98765 43210", "9876543210"],
    ["09876543210", "9876543210"],
    ["91-98765-43210", "9876543210"]
  ])("normalizes %s", (input, expected) => {
    expect(normalizeIndianMobileNumber(input)).toBe(expected);
  });

  it("rejects invalid Indian mobile numbers", () => {
    expect(validateIndianMobileNumber("12345").valid).toBe(false);
    expect(normalizeIndianMobileNumber("+1 555 123 4567")).toBeNull();
  });

  it("derives lead status with terminal stages taking precedence", () => {
    expect(deriveLeadStatus({ funnelStage: "Lost", paymentConfirmed: true })).toBe(
      "Lost"
    );
    expect(deriveLeadStatus({ funnelStage: "Parked", paymentConfirmed: true })).toBe(
      "Parked"
    );
    expect(deriveLeadStatus({ funnelStage: "Won", paymentConfirmed: false })).toBe(
      "Won"
    );
    expect(deriveLeadStatus({ funnelStage: "Qualified", paymentConfirmed: false })).toBe(
      "Open"
    );
  });

  it("preserves date-only values without timezone drift", () => {
    expect(formatDisplayDate("2026-07-17")).toBe("17/07/2026");
    expect(formatDisplayDateRange("2026-07-01", "2026-07-17")).toBe(
      "01/07/2026 to 17/07/2026"
    );
  });

  it("normalizes location names for routing lookups", () => {
    expect(normalizeLocationKey("Tamil Nadu")).toBe("tamilnadu");
    expect(normalizeLocationKey(" tamilnadu ")).toBe("tamilnadu");
    expect(normalizeLocationKey("Bangalore Rural")).toBe("bangalorerural");
    expect(normalizeLocationKey("Bangalore-Rural")).toBe("bangalorerural");
  });

  it("round-trips private storage references", () => {
    const path = "pilots/test/report.pdf";
    const reference = storageReferenceFromPath(path);

    expect(isStorageReference(reference)).toBe(true);
    expect(storagePathFromReference(reference)).toBe(path);
    expect(storagePathFromReference("https://example.com/report.pdf")).toBeNull();
    expect(uploadRules["lab-report"].maxBytes).toBe(25 * 1024 * 1024);
    expect(uploadRules["lab-report"].extensions).toContain(".xlsx");
  });

  it("groups protected payment links by product", () => {
    const rows: PaymentLink[] = [
      {
        amount_inr: 60_000,
        discount_percent: 0,
        offer_label: "Regular price",
        payment_url: "https://example.test/regular",
        product_name: "Jahnavi",
        regular_price_inr: 60_000
      },
      {
        amount_inr: 54_000,
        discount_percent: 10,
        offer_label: "10% discount",
        payment_url: "https://example.test/discount",
        product_name: "Jahnavi",
        regular_price_inr: 60_000
      }
    ];

    expect(groupPaymentLinks(rows)).toEqual([
      {
        links: rows,
        product: "Jahnavi",
        regularPrice: 60_000
      }
    ]);
  });
});
