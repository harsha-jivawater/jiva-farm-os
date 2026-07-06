export function deriveLeadStatus({
  funnelStage,
  paymentConfirmed
}: {
  funnelStage: string | null | undefined;
  paymentConfirmed: boolean;
}) {
  if (funnelStage === "Lost") {
    return "Lost";
  }

  if (funnelStage === "Parked") {
    return "Parked";
  }

  if (paymentConfirmed || funnelStage === "Won") {
    return "Won";
  }

  return "Open";
}
