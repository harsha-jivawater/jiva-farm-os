import type { PlannedPilotVisit } from "@/lib/pilots/types";

export const plannedVisitTypeOptions = [
  { value: "Baseline visit", label: "Baseline visit" },
  { value: "Installation visit", label: "Installation visit" },
  { value: "Routine monitoring visit", label: "Routine monitoring visit" },
  { value: "Crop-stage visit", label: "Crop-stage visit" },
  { value: "Issue/incident visit", label: "Issue/incident visit" },
  { value: "Final visit / harvest visit", label: "Final visit / harvest visit" },
  { value: "Additional visit", label: "Additional visit" }
] as const;

export const plannedVisitStatusOptions = [
  { value: "Planned", label: "Planned" },
  { value: "Assigned", label: "Assigned" },
  { value: "Due", label: "Due" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Rescheduled", label: "Rescheduled" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Unable to Complete", label: "Unable to Complete" }
] as const;

export const visitParameterOptions = [
  "Germination (%)",
  "Plant height",
  "Stem girth",
  "Number of leaves",
  "Number of branches/tillers",
  "Leaf length",
  "Leaf width",
  "Leaf area",
  "No. of Internodes",
  "Internodal length",
  "Chlorophyll (SPAD)",
  "Root length",
  "Fresh biomass",
  "Dry biomass",
  "Number of flowers",
  "Fruit/Pod/Grain set",
  "Number of fruits/pods/grains",
  "Produce length",
  "Produce girth/diameter/circumference",
  "Average produce weight",
  "Test weight (100 or 1000 seeds)",
  "Yield per plant",
  "Marketable yield",
  "Total yield (kg/ha or t/ha)",
  "Biomass yield",
  "Harvest Index",
  "TSS (°Brix)",
  "Dry matter",
  "Moisture",
  "Protein",
  "Oil (where applicable)",
  "Sugar/Starch (where applicable)",
  "Vitamin C (fruits and vegetables)",
  "Colour",
  "Firmness",
  "Shelf life"
] as const;

export const defaultPlannedVisitType = "Routine monitoring visit";
export const defaultPlannedVisitStatus = "Planned";

export function parameterInputName(parameter: string) {
  return `parameter_observation_${parameter
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")}`;
}

export function plannedVisitTypeToActualVisitType(type: string | null | undefined) {
  switch (type) {
    case "Baseline visit":
      return "Baseline Visit";
    case "Installation visit":
      return "Installation Visit";
    case "Issue/incident visit":
      return "Issue Visit";
    case "Final visit / harvest visit":
      return "Harvest Visit";
    case "Routine monitoring visit":
    case "Crop-stage visit":
      return "Monitoring Visit";
    default:
      return "Other";
  }
}

export function displayPlannedVisitStatus(
  visit: Pick<
    PlannedPilotVisit,
    "planned_visit_status" | "planned_visit_date" | "linked_visit_report_id"
  >,
  today: string
) {
  if (visit.linked_visit_report_id || visit.planned_visit_status === "Completed") {
    return "Completed";
  }

  if (["Cancelled", "Unable to Complete", "In Progress", "Rescheduled"].includes(visit.planned_visit_status)) {
    return visit.planned_visit_status;
  }

  if (visit.planned_visit_date < today) {
    return "Missed / Overdue";
  }

  if (visit.planned_visit_date === today) {
    return "Due";
  }

  return visit.planned_visit_status;
}
