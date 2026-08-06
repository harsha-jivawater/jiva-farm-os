export const institutionSaleOrderStatusOptions = [
  { value: "Pending Payment", label: "Pending Payment" },
  { value: "Payment Confirmed", label: "Payment Confirmed" },
  { value: "Partially Dispatched", label: "Partially Dispatched" },
  { value: "Dispatched", label: "Dispatched" },
  { value: "Partially Installed", label: "Partially Installed" },
  { value: "Installed", label: "Installed" },
  { value: "On Hold", label: "On Hold" },
  { value: "Cancelled", label: "Cancelled" }
] as const;

export const institutionSalePaymentStatusOptions = [
  { value: "Pending", label: "Pending" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Waived", label: "Waived" },
  { value: "Refunded", label: "Refunded" },
  { value: "Not Required", label: "Not Required" }
] as const;

export const institutionSaleAllocationStatusOptions = [
  { value: "Ready for Dispatch", label: "Ready for Dispatch" },
  { value: "Dispatch Requested", label: "Dispatch Requested" },
  { value: "Dispatched", label: "Dispatched" },
  { value: "Installation Pending", label: "Installation Pending" },
  { value: "Installed", label: "Installed" },
  { value: "On Hold", label: "On Hold" },
  { value: "Cancelled", label: "Cancelled" }
] as const;

export const paymentReadyInstitutionSaleStatuses = [
  "Confirmed",
  "Waived",
  "Not Required"
] as const;

export function isInstitutionSalePaymentReady(
  paymentStatus: string | null | undefined
) {
  return (paymentReadyInstitutionSaleStatuses as readonly string[]).includes(
    paymentStatus ?? ""
  );
}

export function rollupInstitutionSaleOrderStatus({
  lineStatuses,
  paymentStatus
}: {
  lineStatuses: string[];
  paymentStatus: string | null | undefined;
}) {
  if (paymentStatus === "Refunded") {
    return "Cancelled";
  }

  if (!isInstitutionSalePaymentReady(paymentStatus)) {
    return "Pending Payment";
  }

  const activeLineStatuses = lineStatuses.filter(
    (status) => status !== "Cancelled"
  );

  if (!activeLineStatuses.length) {
    return "Payment Confirmed";
  }

  if (activeLineStatuses.every((status) => status === "Installed")) {
    return "Installed";
  }

  if (activeLineStatuses.some((status) => status === "Installed")) {
    return "Partially Installed";
  }

  if (
    activeLineStatuses.every((status) =>
      ["Dispatched", "Installation Pending"].includes(status)
    )
  ) {
    return "Dispatched";
  }

  if (
    activeLineStatuses.some((status) =>
      ["Dispatched", "Installation Pending"].includes(status)
    )
  ) {
    return "Partially Dispatched";
  }

  return "Payment Confirmed";
}

export function labelForInstitutionSaleOption(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  if (!value) {
    return "Not set";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}
