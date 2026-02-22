import { describe, expect, it } from "vitest";

import { Duration } from "../../../../../src/domain/work-logs/valueObjects/duration.js";

describe("duration value object", () => {
  it("creates duration with valid integer minutes", () => {
    const duration = Duration.fromMinutes(45);
    expect(duration.minutes).toBe(45);
  });

  it("rejects negative minutes", () => {
    expect(() => Duration.fromMinutes(-1)).toThrowError("WORK_LOG_INVALID_DURATION");
  });

  it("rejects non-integer minutes", () => {
    expect(() => Duration.fromMinutes(12.5)).toThrowError("WORK_LOG_INVALID_DURATION");
  });

  it("rejects subtract when break is greater than worked duration", () => {
    const worked = Duration.fromMinutes(30);
    const breakDuration = Duration.fromMinutes(45);

    expect(() => worked.subtract(breakDuration)).toThrowError(
      "WORK_LOG_INVALID_BREAK_DURATION",
    );
  });
});
