import type { Json } from "@/lib/supabase/database.types";

export type SalesForecastTotals = { actual: number; committed: number; likely: number; upside: number; at_risk: number };
export type SalesForecastSummary = { monthStart: string; capturedAt: string; totals: SalesForecastTotals };

export function normalizeSalesMonth(input: string | null | undefined) {
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(input ?? "");
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return `${match[1]}-${match[2]}-01`;
}

export function currentSalesMonth() {
  return `${new Date().toISOString().slice(0, 7)}-01`;
}

export function parseSalesForecastSummary(value: Json | null): SalesForecastSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const totals = value.totals;
  if (!totals || typeof totals !== "object" || Array.isArray(totals)) return null;
  const keys: (keyof SalesForecastTotals)[] = ["actual", "committed", "likely", "upside", "at_risk"];
  if (!keys.every((key) => typeof totals[key] === "number")) return null;
  if (typeof value.monthStart !== "string" || typeof value.capturedAt !== "string") return null;
  return value as SalesForecastSummary;
}
