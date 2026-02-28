export const calculateGst = (
  subtotalCents: number,
  gstPercentage: number,
): number => {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    throw new Error("subtotalCents must be a non-negative integer");
  }

  if (!Number.isInteger(gstPercentage) || gstPercentage < 0) {
    throw new Error("gstPercentage must be a non-negative integer");
  }

  return Math.round((subtotalCents * gstPercentage) / 100);
};
