import { throwInvoiceDomainError } from "../errors/invoiceDomainErrors.js";

export const calculateGst = (
  subtotalCents: number,
  gstPercentage: number,
): number => {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    throwInvoiceDomainError("INVOICE_INVALID_SUBTOTAL");
  }

  if (!Number.isInteger(gstPercentage) || gstPercentage < 0) {
    throwInvoiceDomainError("INVOICE_INVALID_GST_TOTAL");
  }

  return Math.round((subtotalCents * gstPercentage) / 100);
};
