import { describe, expect, it } from "vitest";

import { calculateGst } from "../../../../../src/domain/invoices/rules/gst.js";

describe("gst rules", () => {
  it("calculates gst in cents", () => {
    expect(calculateGst(10_000, 10)).toBe(1_000);
  });

  it("rejects invalid values", () => {
    expect(() => calculateGst(-1, 10)).toThrow(
      "subtotalCents must be a non-negative integer",
    );
    expect(() => calculateGst(10_000, -1)).toThrow(
      "gstPercentage must be a non-negative integer",
    );
  });
});
