import { describe, expect, it } from "vitest";

import { WorkLogItem } from "../../../../../src/domain/work-logs/entities/workLogItem.js";

describe("workLogItem entity", () => {
  it("creates item and calculates payable duration and total", () => {
    const item = WorkLogItem.create({
      id: "item-1",
      description: "Regular shift",
      startAt: "2026-02-22T09:00:00.000Z",
      endAt: "2026-02-22T12:00:00.000Z",
      breakMinutes: 30,
      hourlyRateCents: 12000,
    });

    expect(item.payableDuration.minutes).toBe(150);
    expect(item.totalCents).toBe(30000);
  });

  it("throws when description is empty", () => {
    expect(() =>
      WorkLogItem.create({
        id: "item-1",
        description: "  ",
        startAt: "2026-02-22T09:00:00.000Z",
        endAt: "2026-02-22T12:00:00.000Z",
        breakMinutes: 30,
        hourlyRateCents: 12000,
      }),
    ).toThrowError("WORK_LOG_ITEM_INVALID_DESCRIPTION");
  });
});
