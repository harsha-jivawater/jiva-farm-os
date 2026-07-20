import { selectableCropOptions } from "@/lib/crops/crop-library";

export const marketingAssetAudienceOptions = [
  { value: "Farmers", label: "Farmers" },
  { value: "Dealers", label: "Dealers" },
  { value: "Corporates", label: "Corporates" },
  { value: "Internal", label: "Internal team" }
] as const;

export const marketingAssetSectorOptions = [
  { value: "Agriculture", label: "Agriculture" },
  { value: "Poultry", label: "Poultry" },
  { value: "Dairy", label: "Dairy" },
  { value: "Hydroponics", label: "Hydroponics" },
  { value: "Fisheries", label: "Fisheries" },
  { value: "Brewery", label: "Brewery" },
  { value: "Industrial", label: "Industrial" }
] as const;

export const marketingAssetCropOptions = selectableCropOptions;

export const marketingAssetLanguageOptions = [
  { value: "English", label: "English" },
  { value: "Tamil", label: "Tamil" },
  { value: "Kannada", label: "Kannada" },
  { value: "Hindi", label: "Hindi" },
  { value: "Telugu", label: "Telugu" },
  { value: "Malayalam", label: "Malayalam" },
  { value: "Bengali", label: "Bengali" },
  { value: "Punjabi", label: "Punjabi" },
  { value: "Marathi", label: "Marathi" },
  { value: "Other", label: "Other" }
] as const;

export const marketingAssetTypeOptions = [
  "Case Study",
  "Testimonial",
  "Leaflet",
  "Booklet",
  "Product Sheet",
  "Pitch Deck",
  "Standee",
  "Press Ad",
  "Onboarding Form",
  "Logo",
  "Training Manual",
  "Video",
  "Digital Flyer",
  "WhatsApp Asset",
  "ROI Table",
  "Rate Card",
  "Corporate Brochure",
  "Research Document",
  "Collaboration Details",
  "Research Partner Profile",
  "Test Report",
  "Brand Book",
  "SOP / Trial Template",
  "Newsletter",
  "Photography Guide",
  "Video Recording Guide",
  "Other"
].map((value) => ({ label: value, value }));

export const marketingAssetDeliveryOptions = [
  { value: "Digital", label: "Digital" },
  { value: "Physical", label: "Physical" },
  { value: "Both", label: "Physical and digital" },
  { value: "Insert Link", label: "Insert link" }
] as const;

export const marketingAssetStatusOptions = [
  { value: "Pending Review", label: "Pending review" },
  { value: "Changes Requested", label: "Changes requested" },
  { value: "Published", label: "Published" },
  { value: "Archived", label: "Archived" }
] as const;

export function optionIncludes(
  options: ReadonlyArray<{ value: string }>,
  value: string
) {
  return options.some((option) => option.value === value);
}
