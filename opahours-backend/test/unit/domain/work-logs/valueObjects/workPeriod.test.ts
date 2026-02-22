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

  it("accepts ISO with explicit timezone offset", () => {
    const period = WorkPeriod.create({
      startAt: "2026-02-22T09:00:00-03:00",
      endAt: "2026-02-22T10:00:00-03:00",
    });

    expect(period.getWorkedDuration().minutes).toBe(60);
  });

  it("throws error when end is before start", () => {
    expect(() =>
      WorkPeriod.create({
        startAt: "2026-02-22T10:00:00.000Z",
        endAt: "2026-02-22T09:00:00.000Z",
      }),
    ).toThrowError("WORK_LOG_INVALID_PERIOD");
  });

  it("throws error when datetime string has no timezone", () => {
    expect(() =>
      WorkPeriod.create({
        startAt: "2026-02-22T09:00:00",
        endAt: "2026-02-22T10:00:00",
      }),
    ).toThrowError("WORK_LOG_INVALID_PERIOD_TIMEZONE");
  });

  it("throws error when period precision is not minute-based", () => {
    expect(() =>
      WorkPeriod.create({
        startAt: "2026-02-22T09:00:30.000Z",
        endAt: "2026-02-22T10:00:00.000Z",
      }),
    ).toThrowError("WORK_LOG_INVALID_PERIOD_PRECISION");
  });

  it("throws error when duration is greater than 24h", () => {
    expect(() =>
      WorkPeriod.create({
        startAt: "2026-02-22T09:00:00.000Z",
        endAt: "2026-02-23T09:01:00.000Z",
      }),
    ).toThrowError("WORK_LOG_DURATION_EXCEEDS_LIMIT");
  });
});
