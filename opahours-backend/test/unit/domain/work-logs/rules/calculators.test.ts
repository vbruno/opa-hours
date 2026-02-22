import { describe, expect, it } from "vitest";

import {
  calculateItemTotalCents,
  calculatePayableDuration,
  calculateWorkLogTotal,
} from "../../../../../src/domain/work-logs/rules/calculators.js";
import { Duration } from "../../../../../src/domain/work-logs/valueObjects/duration.js";
import { HourlyRate } from "../../../../../src/domain/work-logs/valueObjects/hourlyRate.js";
import { WorkPeriod } from "../../../../../src/domain/work-logs/valueObjects/workPeriod.js";

describe("work-log calculators", () => {
  it("calculates payable duration subtracting break", () => {
    const period = WorkPeriod.create({
      startAt: "2026-02-22T09:00:00.000Z",
      endAt: "2026-02-22T12:00:00.000Z",
    });
    const payable = calculatePayableDuration(period, Duration.fromMinutes(30));

    expect(payable.minutes).toBe(150);
  });

  it("throws when break is greater than worked duration", () => {
    const period = WorkPeriod.create({
      startAt: "2026-02-22T09:00:00.000Z",
      endAt: "2026-02-22T10:00:00.000Z",
    });

    expect(() => calculatePayableDuration(period, Duration.fromMinutes(70))).toThrowError(
      "WORK_LOG_INVALID_BREAK_DURATION",
    );
  });

  it("calculates total cents by duration and hourly rate", () => {
    const total = calculateItemTotalCents(
      Duration.fromMinutes(90),
      HourlyRate.fromCents(10000),
    );

    expect(total).toBe(15000);
  });

  it("calculates work-log total from items", () => {
    const total = calculateWorkLogTotal([
      { totalCents: 15000 },
      { totalCents: 20000 },
    ]);

    expect(total).toBe(35000);
  });
});
