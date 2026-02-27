import { describe, expect, it } from "vitest";

import { WorkLogItem } from "../../../../../src/domain/work-logs/entities/workLogItem.js";

describe("workLogItem entity", () => {
  it("creates item and calculates payable duration and total", () => {
    const item = WorkLogItem.create({
      id: "item-1",
      location: "Client HQ",
      startAt: "2026-02-22T09:00:00.000Z",
      endAt: "2026-02-22T12:00:00.000Z",
      breakMinutes: 30,
      hourlyRateCents: 12000,
      additionalCents: 2500,
      notes: "Morning shift",
    });

    expect(item.location).toBe("Client HQ");
    expect(item.notes).toBe("Morning shift");
    expect(item.payableDuration.minutes).toBe(150);
    expect(item.totalCents).toBe(32500);
  });

  it("throws when location is empty", () => {
    expect(() =>
      WorkLogItem.create({
        id: "item-1",
        location: "  ",
        startAt: "2026-02-22T09:00:00.000Z",
        endAt: "2026-02-22T12:00:00.000Z",
        breakMinutes: 30,
        hourlyRateCents: 12000,
      }),
    ).toThrowError("WORK_LOG_ITEM_INVALID_LOCATION");
  });

  it("throws when id is empty", () => {
    expect(() =>
      WorkLogItem.create({
        id: "   ",
        location: "Client HQ",
        startAt: "2026-02-22T09:00:00.000Z",
        endAt: "2026-02-22T12:00:00.000Z",
        breakMinutes: 30,
        hourlyRateCents: 12000,
      }),
    ).toThrowError("WORK_LOG_ITEM_INVALID_ID");
  });

  it("throws when break is negative", () => {
    expect(() =>
      WorkLogItem.create({
        id: "item-1",
        location: "Client HQ",
        startAt: "2026-02-22T09:00:00.000Z",
        endAt: "2026-02-22T12:00:00.000Z",
        breakMinutes: -1,
        hourlyRateCents: 12000,
      }),
    ).toThrowError("WORK_LOG_INVALID_DURATION");
  });

  it("throws when hourly rate is invalid", () => {
    expect(() =>
      WorkLogItem.create({
        id: "item-1",
        location: "Client HQ",
        startAt: "2026-02-22T09:00:00.000Z",
        endAt: "2026-02-22T12:00:00.000Z",
        breakMinutes: 30,
        hourlyRateCents: 0,
      }),
    ).toThrowError("WORK_LOG_INVALID_HOURLY_RATE");
  });

  it("throws when notes are too long", () => {
    expect(() =>
      WorkLogItem.create({
        id: "item-1",
        location: "Client HQ",
        startAt: "2026-02-22T09:00:00.000Z",
        endAt: "2026-02-22T12:00:00.000Z",
        breakMinutes: 30,
        hourlyRateCents: 12000,
        notes: "a".repeat(1001),
      }),
    ).toThrowError("WORK_LOG_ITEM_INVALID_NOTES");
  });

  it("throws when item additional is invalid", () => {
    expect(() =>
      WorkLogItem.create({
        id: "item-1",
        location: "Client HQ",
        startAt: "2026-02-22T09:00:00.000Z",
        endAt: "2026-02-22T12:00:00.000Z",
        breakMinutes: 30,
        hourlyRateCents: 12000,
        additionalCents: 12.5,
      }),
    ).toThrowError("WORK_LOG_INVALID_ADDITIONAL_AMOUNT");
  });
});
