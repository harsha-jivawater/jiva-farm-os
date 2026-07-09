export const userRoleOptions = [
  { value: "Admin", label: "Admin" },
  { value: "Management", label: "Management" },
  { value: "Sales Head", label: "Sales Head" },
  { value: "RSM", label: "RSM" },
  { value: "Salesperson", label: "Salesperson" },
  { value: "Research Assistant", label: "Research Assistant" },
  { value: "Agronomist", label: "Agronomist" },
  { value: "R&D Head", label: "R&D Head" },
  { value: "Marketing Head", label: "Marketing Head" },
  { value: "Designer", label: "Designer" },
  { value: "HR & Legal", label: "HR & Legal" },
  { value: "Accounts", label: "Accounts" },
  // DB role value remains "Stock / Dispatch"; UI display label is "Customer Service Team".
  { value: "Stock / Dispatch", label: "Customer Service Team" },
  { value: "Viewer", label: "Viewer" }
] as const;

export const defaultUserRole = "Salesperson";

export function managerRolesForRole(role: string | null | undefined) {
  if (role === "Research Assistant") {
    return ["Agronomist"];
  }

  if (role === "Agronomist") {
    return ["R&D Head"];
  }

  if (role === "Salesperson") {
    return ["RSM"];
  }

  if (role === "RSM") {
    return ["Sales Head"];
  }

  return [];
}

export function labelForRole(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return userRoleOptions.find((option) => option.value === value)?.label ?? value;
}
