export type CropLibraryItem = {
  value: string;
  label: string;
  mainCategory: string;
  subcategory: string;
  aliases?: string[];
  legacy?: boolean;
};

export type CropOption = {
  value: string;
  label: string;
};

const AGRICULTURE = "Agriculture / Field Crops";
const HORTICULTURE = "Horticulture Crops";
const LEGACY = "Legacy / Existing Values";
const SPECIAL = "Other / Unknown";

export const cropLibrary: CropLibraryItem[] = [
  { value: "Paddy", label: "Rice / Paddy", mainCategory: AGRICULTURE, subcategory: "Cereals", aliases: ["Rice"] },
  { value: "Wheat", label: "Wheat", mainCategory: AGRICULTURE, subcategory: "Cereals" },
  { value: "Maize", label: "Maize", mainCategory: AGRICULTURE, subcategory: "Cereals" },
  { value: "Sorghum (Jowar)", label: "Sorghum (Jowar)", mainCategory: AGRICULTURE, subcategory: "Cereals" },
  { value: "Pearl millet (Bajra)", label: "Pearl millet (Bajra)", mainCategory: AGRICULTURE, subcategory: "Cereals" },
  { value: "Finger millet (Ragi)", label: "Finger millet (Ragi)", mainCategory: AGRICULTURE, subcategory: "Cereals" },
  { value: "Barley", label: "Barley", mainCategory: AGRICULTURE, subcategory: "Cereals" },
  { value: "Small millets (Foxtail, Little, Kodo, Barnyard, Proso)", label: "Small millets (Foxtail, Little, Kodo, Barnyard, Proso)", mainCategory: AGRICULTURE, subcategory: "Cereals" },
  { value: "Chickpea (Gram)", label: "Chickpea (Gram)", mainCategory: AGRICULTURE, subcategory: "Pulses" },
  { value: "Pigeon pea (Red gram/Tur)", label: "Pigeon pea (Red gram/Tur)", mainCategory: AGRICULTURE, subcategory: "Pulses" },
  { value: "Green gram (Moong)", label: "Green gram (Moong)", mainCategory: AGRICULTURE, subcategory: "Pulses" },
  { value: "Black gram (Urad)", label: "Black gram (Urad)", mainCategory: AGRICULTURE, subcategory: "Pulses" },
  { value: "Field pea", label: "Field pea", mainCategory: AGRICULTURE, subcategory: "Pulses" },
  { value: "Cowpea", label: "Cowpea", mainCategory: AGRICULTURE, subcategory: "Pulses" },
  { value: "Horse gram", label: "Horse gram", mainCategory: AGRICULTURE, subcategory: "Pulses" },
  { value: "Lablab bean", label: "Lablab bean", mainCategory: AGRICULTURE, subcategory: "Pulses" },
  { value: "Groundnut", label: "Groundnut", mainCategory: AGRICULTURE, subcategory: "Oilseed Crops" },
  { value: "Soybean", label: "Soybean", mainCategory: AGRICULTURE, subcategory: "Oilseed Crops" },
  { value: "Mustard", label: "Mustard", mainCategory: AGRICULTURE, subcategory: "Oilseed Crops" },
  { value: "Sesame", label: "Sesame", mainCategory: AGRICULTURE, subcategory: "Oilseed Crops" },
  { value: "Sunflower", label: "Sunflower", mainCategory: AGRICULTURE, subcategory: "Oilseed Crops" },
  { value: "Castor", label: "Castor", mainCategory: AGRICULTURE, subcategory: "Oilseed Crops" },
  { value: "Oil palm", label: "Oil palm", mainCategory: AGRICULTURE, subcategory: "Oilseed Crops" },
  { value: "Sugarcane", label: "Sugarcane", mainCategory: AGRICULTURE, subcategory: "Commercial/Cash Crops" },
  { value: "Cotton", label: "Cotton", mainCategory: AGRICULTURE, subcategory: "Commercial/Cash Crops", aliases: ["Fibre Crops"] },
  { value: "Tobacco", label: "Tobacco", mainCategory: AGRICULTURE, subcategory: "Commercial/Cash Crops" },
  { value: "Jute", label: "Jute", mainCategory: AGRICULTURE, subcategory: "Fibre Crops" },
  { value: "Mesta", label: "Mesta", mainCategory: AGRICULTURE, subcategory: "Fibre Crops" },
  { value: "Sunn hemp", label: "Sunn hemp", mainCategory: AGRICULTURE, subcategory: "Fibre Crops" },
  { value: "Coconut", label: "Coconut", mainCategory: AGRICULTURE, subcategory: "Plantation Crops" },
  { value: "Arecanut", label: "Arecanut", mainCategory: AGRICULTURE, subcategory: "Plantation Crops" },
  { value: "Cashew", label: "Cashew", mainCategory: AGRICULTURE, subcategory: "Plantation Crops" },
  { value: "Rubber", label: "Rubber", mainCategory: AGRICULTURE, subcategory: "Plantation Crops" },
  { value: "Cocoa", label: "Cocoa", mainCategory: AGRICULTURE, subcategory: "Plantation Crops" },
  { value: "Coffee", label: "Coffee", mainCategory: AGRICULTURE, subcategory: "Plantation Crops" },
  { value: "Tea", label: "Tea", mainCategory: AGRICULTURE, subcategory: "Plantation Crops" },
  { value: "Silver oak", label: "Silver oak", mainCategory: AGRICULTURE, subcategory: "Plantation Crops" },
  { value: "Napier grass", label: "Napier grass", mainCategory: AGRICULTURE, subcategory: "Fodder Crops" },
  { value: "Sorghum (fodder)", label: "Sorghum (fodder)", mainCategory: AGRICULTURE, subcategory: "Fodder Crops" },
  { value: "Maize (fodder)", label: "Maize (fodder)", mainCategory: AGRICULTURE, subcategory: "Fodder Crops" },
  { value: "Cowpea (fodder)", label: "Cowpea (fodder)", mainCategory: AGRICULTURE, subcategory: "Fodder Crops" },
  { value: "Cumin", label: "Cumin", mainCategory: AGRICULTURE, subcategory: "Spice & Condiment Field Crops" },
  { value: "Mango", label: "Mango", mainCategory: HORTICULTURE, subcategory: "Fruits" },
  { value: "Banana", label: "Banana", mainCategory: HORTICULTURE, subcategory: "Fruits" },
  { value: "Citrus", label: "Citrus", mainCategory: HORTICULTURE, subcategory: "Fruits" },
  { value: "Guava", label: "Guava", mainCategory: HORTICULTURE, subcategory: "Fruits" },
  { value: "Pomegranate", label: "Pomegranate", mainCategory: HORTICULTURE, subcategory: "Fruits" },
  { value: "Papaya", label: "Papaya", mainCategory: HORTICULTURE, subcategory: "Fruits" },
  { value: "Grapes", label: "Grapes", mainCategory: HORTICULTURE, subcategory: "Fruits" },
  { value: "Pineapple", label: "Pineapple", mainCategory: HORTICULTURE, subcategory: "Fruits" },
  { value: "Sapota", label: "Sapota", mainCategory: HORTICULTURE, subcategory: "Fruits" },
  { value: "Aonla", label: "Aonla", mainCategory: HORTICULTURE, subcategory: "Fruits" },
  { value: "Watermelon", label: "Watermelon", mainCategory: HORTICULTURE, subcategory: "Fruits", aliases: ["Cucurbits"] },
  { value: "Muskmelon", label: "Muskmelon", mainCategory: HORTICULTURE, subcategory: "Fruits", aliases: ["Cucurbits"] },
  { value: "Avocado", label: "Avocado", mainCategory: HORTICULTURE, subcategory: "Fruits" },
  { value: "Strawberry", label: "Strawberry", mainCategory: HORTICULTURE, subcategory: "Fruits" },
  { value: "Tomato", label: "Tomato", mainCategory: HORTICULTURE, subcategory: "Vegetables - Solanaceous" },
  { value: "Brinjal (Eggplant)", label: "Brinjal (Eggplant)", mainCategory: HORTICULTURE, subcategory: "Vegetables - Solanaceous" },
  { value: "Okra", label: "Okra", mainCategory: HORTICULTURE, subcategory: "Vegetables - Solanaceous" },
  { value: "Chilli", label: "Chilli", mainCategory: HORTICULTURE, subcategory: "Vegetables - Solanaceous", aliases: ["Spices"] },
  { value: "Capsicum", label: "Capsicum", mainCategory: HORTICULTURE, subcategory: "Vegetables - Solanaceous" },
  { value: "Gherkins", label: "Gerkin / Gherkins", mainCategory: HORTICULTURE, subcategory: "Cucurbits", aliases: ["Gerkin"] },
  { value: "Cucumber", label: "Cucumber", mainCategory: HORTICULTURE, subcategory: "Cucurbits" },
  { value: "Bitter gourd", label: "Bitter gourd", mainCategory: HORTICULTURE, subcategory: "Cucurbits" },
  { value: "Bottle gourd", label: "Bottle gourd", mainCategory: HORTICULTURE, subcategory: "Cucurbits" },
  { value: "Ridge gourd", label: "Ridge gourd", mainCategory: HORTICULTURE, subcategory: "Cucurbits" },
  { value: "Sponge gourd", label: "Sponge gourd", mainCategory: HORTICULTURE, subcategory: "Cucurbits" },
  { value: "Snake gourd", label: "Snake gourd", mainCategory: HORTICULTURE, subcategory: "Cucurbits" },
  { value: "Pumpkin", label: "Pumpkin", mainCategory: HORTICULTURE, subcategory: "Cucurbits" },
  { value: "Ash gourd", label: "Ash gourd", mainCategory: HORTICULTURE, subcategory: "Cucurbits" },
  { value: "Cabbage", label: "Cabbage", mainCategory: HORTICULTURE, subcategory: "Cole Crops" },
  { value: "Cauliflower", label: "Cauliflower", mainCategory: HORTICULTURE, subcategory: "Cole Crops" },
  { value: "Broccoli", label: "Broccoli", mainCategory: HORTICULTURE, subcategory: "Cole Crops" },
  { value: "Knol-khol", label: "Knol-khol", mainCategory: HORTICULTURE, subcategory: "Cole Crops" },
  { value: "Potato", label: "Potato", mainCategory: HORTICULTURE, subcategory: "Root & Tuber Crops" },
  { value: "Onion", label: "Onion", mainCategory: HORTICULTURE, subcategory: "Root & Tuber Crops" },
  { value: "Garlic", label: "Garlic", mainCategory: HORTICULTURE, subcategory: "Root & Tuber Crops", aliases: ["Spices"] },
  { value: "Carrot", label: "Carrot", mainCategory: HORTICULTURE, subcategory: "Root & Tuber Crops" },
  { value: "Beetroot", label: "Beetroot", mainCategory: HORTICULTURE, subcategory: "Root & Tuber Crops" },
  { value: "Radish", label: "Radish", mainCategory: HORTICULTURE, subcategory: "Root & Tuber Crops" },
  { value: "Turnip", label: "Turnip", mainCategory: HORTICULTURE, subcategory: "Root & Tuber Crops" },
  { value: "Sweet potato", label: "Sweet potato", mainCategory: HORTICULTURE, subcategory: "Root & Tuber Crops" },
  { value: "Tapioca (Cassava)", label: "Tapioca (Cassava)", mainCategory: HORTICULTURE, subcategory: "Root & Tuber Crops" },
  { value: "Elephant foot yam", label: "Elephant foot yam", mainCategory: HORTICULTURE, subcategory: "Root & Tuber Crops" },
  { value: "Hyacinth bean", label: "Hyacinth bean", mainCategory: HORTICULTURE, subcategory: "Leguminous Vegetables" },
  { value: "French bean", label: "French bean", mainCategory: HORTICULTURE, subcategory: "Leguminous Vegetables" },
  { value: "Cluster bean", label: "Cluster bean", mainCategory: HORTICULTURE, subcategory: "Leguminous Vegetables" },
  { value: "Dolichos bean", label: "Dolichos bean", mainCategory: HORTICULTURE, subcategory: "Leguminous Vegetables" },
  { value: "Garden pea", label: "Garden pea", mainCategory: HORTICULTURE, subcategory: "Leguminous Vegetables" },
  { value: "Broad bean", label: "Broad bean", mainCategory: HORTICULTURE, subcategory: "Leguminous Vegetables" },
  { value: "Spinach", label: "Spinach", mainCategory: HORTICULTURE, subcategory: "Leafy Vegetables" },
  { value: "Amaranthus", label: "Amaranthus", mainCategory: HORTICULTURE, subcategory: "Leafy Vegetables" },
  { value: "Coriander", label: "Coriander", mainCategory: HORTICULTURE, subcategory: "Leafy Vegetables", aliases: ["Spices", "Spice & Condiment Field Crops"] },
  { value: "Fenugreek", label: "Fenugreek", mainCategory: HORTICULTURE, subcategory: "Leafy Vegetables", aliases: ["Spices", "Spice & Condiment Field Crops"] },
  { value: "Lettuce", label: "Lettuce", mainCategory: HORTICULTURE, subcategory: "Leafy Vegetables" },
  { value: "Celery", label: "Celery", mainCategory: HORTICULTURE, subcategory: "Leafy Vegetables" },
  { value: "Marigold", label: "Marigold", mainCategory: HORTICULTURE, subcategory: "Flower Crops" },
  { value: "Rose", label: "Rose", mainCategory: HORTICULTURE, subcategory: "Flower Crops" },
  { value: "Jasmine", label: "Jasmine", mainCategory: HORTICULTURE, subcategory: "Flower Crops" },
  { value: "Chrysanthemum", label: "Chrysanthemum", mainCategory: HORTICULTURE, subcategory: "Flower Crops" },
  { value: "Tuberose", label: "Tuberose", mainCategory: HORTICULTURE, subcategory: "Flower Crops" },
  { value: "Gerbera", label: "Gerbera", mainCategory: HORTICULTURE, subcategory: "Flower Crops" },
  { value: "Carnation", label: "Carnation", mainCategory: HORTICULTURE, subcategory: "Flower Crops" },
  { value: "Orchid", label: "Orchid", mainCategory: HORTICULTURE, subcategory: "Flower Crops" },
  { value: "Gladiolus", label: "Gladiolus", mainCategory: HORTICULTURE, subcategory: "Flower Crops" },
  { value: "Lilium", label: "Lilium", mainCategory: HORTICULTURE, subcategory: "Flower Crops" },
  { value: "Turmeric", label: "Turmeric", mainCategory: HORTICULTURE, subcategory: "Spices" },
  { value: "Ginger", label: "Ginger", mainCategory: HORTICULTURE, subcategory: "Spices" },
  { value: "Vegetables", label: "Vegetables (legacy general)", mainCategory: LEGACY, subcategory: "General crop group", legacy: true },
  { value: "Floriculture", label: "Floriculture (legacy general)", mainCategory: LEGACY, subcategory: "General crop group", legacy: true },
  { value: "Spices", label: "Spices (legacy general)", mainCategory: LEGACY, subcategory: "General crop group", legacy: true },
  { value: "Seed Production", label: "Seed Production (legacy general)", mainCategory: LEGACY, subcategory: "General crop group", legacy: true },
  { value: "Mixed Crops", label: "Mixed Crops (legacy general)", mainCategory: LEGACY, subcategory: "General crop group", legacy: true },
  { value: "Other", label: "Add crop not in list", mainCategory: SPECIAL, subcategory: "Custom crop" },
  { value: "Unknown", label: "Unknown", mainCategory: SPECIAL, subcategory: "Incomplete data" }
];

export const cropOptions: CropOption[] = cropLibrary.map(({ value, label }) => ({
  value,
  label
}));

export function cropContext(value: string | null | undefined) {
  const item = cropLibrary.find((crop) => crop.value === value);
  return item ? `${item.mainCategory} > ${item.subcategory}` : "";
}

export function cropDisplayLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return cropLibrary.find((crop) => crop.value === value)?.label ?? value;
}
