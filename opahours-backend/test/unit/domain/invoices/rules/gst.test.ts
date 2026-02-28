import { describe, expect, it } from "vitest";

import { calculateGst } from "../../../../../src/domain/invoices/rules/gst.js";
import { InvoiceDomainError } from "../../../../../src/domain/invoices/errors/invoiceDomainErrors.js";

describe("gst rules", () => {
  it("calculates gst in cents", () => {
    expect(calculateGst(10_000, 10)).toBe(1_000);
  });

  it("rejects invalid values", () => {
    try {
      calculateGst(-1, 10);
    } catch (error) {
      expect(error).toBeInstanceOf(InvoiceDomainError);
      expect((error as InvoiceDomainError).code).toBe(
        "INVOICE_INVALID_SUBTOTAL",
      );
    }

    try {
      calculateGst(10_000, -1);
    } catch (error) {
      expect(error).toBeInstanceOf(InvoiceDomainError);
      expect((error as InvoiceDomainError).code).toBe(
        "INVOICE_INVALID_GST_TOTAL",
      );
    }
  });
});
