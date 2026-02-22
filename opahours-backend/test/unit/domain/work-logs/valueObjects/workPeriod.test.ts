import { describe, expect, it } from "vitest";

import { WorkPeriod } from "../../../../../src/domain/work-logs/valueObjects/workPeriod.js";

describe("workPeriod value object", () => {
  it("builds period and calculates worked duration in minutes", () => {
    const period = WorkPeriod.create({
      startAt: "2026-02-22T09:00:00.000Z",
      endAt: "2026-02-22T17:30:00.000Z",
    });

    expect(period.getWorkedDuration().minutes).toBe(510);
  });

  it("throws error when end is before start", () => {
    expect(() =>
      WorkPeriod.create({
        startAt: "2026-02-22T10:00:00.000Z",
        endAt: "2026-02-22T09:00:00.000Z",
      }),
    ).toThrowError("WORK_LOG_INVALID_PERIOD");
  });
});
