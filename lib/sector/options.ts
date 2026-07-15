export const businessSectorOptions = [
  { value: "Agriculture", label: "Agriculture" },
  { value: "Poultry", label: "Poultry" },
  { value: "Dairy", label: "Dairy" }
] as const;

export const defaultBusinessSector = "Agriculture" as const;

export type BusinessSector = (typeof businessSectorOptions)[number]["value"];

export function isBusinessSector(value: string | null | undefined): value is BusinessSector {
  return businessSectorOptions.some((option) => option.value === value);
}
