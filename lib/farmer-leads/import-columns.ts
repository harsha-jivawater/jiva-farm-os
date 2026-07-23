export const farmerLeadImportColumns = [
  { key: "farmer_name", label: "Farmer Name", required: true },
  { key: "mobile_number", label: "Mobile Number", required: true },
  { key: "business_sector", label: "Business Sector" },
  { key: "lead_source", label: "Lead Source" },
  { key: "village", label: "Village", required: true },
  { key: "district", label: "District", required: true },
  { key: "state", label: "State", required: true },
  { key: "primary_crop", label: "Primary Crop" },
  { key: "other_primary_crop", label: "Other Primary Crop" },
  { key: "lead_type", label: "Lead Type" },
  { key: "irrigation_type", label: "Irrigation Type" },
  { key: "crop_stage", label: "Crop Stage" },
  { key: "land_size_acres", label: "Land Size Acres" },
  { key: "crop_area_acres", label: "Crop Area Acres" },
  { key: "next_action_date", label: "Next Action Date" },
  { key: "followup_due_date", label: "Follow-up Due Date" },
  { key: "lead_code", label: "Lead Code" },
  { key: "remarks", label: "Remarks" }
] as const;

export type FarmerLeadImportColumn = {
  key: string;
  label: string;
  required?: boolean;
};
