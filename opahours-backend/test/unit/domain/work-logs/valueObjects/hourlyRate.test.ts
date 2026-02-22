import { describe, expect, it } from "vitest";

import { HourlyRate } from "../../../../../src/domain/work-logs/valueObjects/hourlyRate.js";

describe("hourlyRate value object", () => {
  it("creates hourly rate with valid cents", () => {
    const rate = HourlyRate.fromCents(12500);
    expect(rate.cents).toBe(12500);
  });

  it("rejects zero value", () => {
    expect(() => HourlyRate.fromCents(0)).toThrowError("WORK_LOG_INVALID_HOURLY_RATE");
  });

  it("rejects negative values", () => {
    expect(() => HourlyRate.fromCents(-100)).toThrowError("WORK_LOG_INVALID_HOURLY_RATE");
  });

  it("rejects non-integer values", () => {
    expect(() => HourlyRate.fromCents(100.1)).toThrowError("WORK_LOG_INVALID_HOURLY_RATE");
  });
});
