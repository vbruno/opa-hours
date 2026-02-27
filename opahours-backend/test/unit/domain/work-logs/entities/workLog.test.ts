import { describe, expect, it } from "vitest";

import { WorkLog } from "../../../../../src/domain/work-logs/entities/workLog.js";
import { WorkLogItem } from "../../../../../src/domain/work-logs/entities/workLogItem.js";

const createItem = (id: string) =>
  WorkLogItem.create({
    id,
    location: `Site ${id}`,
    startAt: "2026-02-22T09:00:00.000Z",
    endAt: "2026-02-22T12:00:00.000Z",
    breakMinutes: 30,
    hourlyRateCents: 10000,
  });

describe("workLog entity", () => {
  it("creates work-log with valid base fields", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      clientId: "client-1",
      workDate: "2026-02-22",
    });

    expect(workLog.id).toBe("work-log-1");
    expect(workLog.personId).toBe("person-1");
    expect(workLog.clientId).toBe("client-1");
    expect(workLog.workDate).toBe("2026-02-22");
    expect(workLog.status).toBe("draft");
    expect(workLog.dailyAdditionalCents).toBe(0);
  });

  it("rejects invalid base fields", () => {
    expect(() =>
      WorkLog.create({
        id: "   ",
        personId: "person-1",
        clientId: "client-1",
        workDate: "2026-02-22",
      }),
    ).toThrowError("WORK_LOG_INVALID_ID");

    expect(() =>
      WorkLog.create({
        id: "work-log-1",
        personId: "   ",
        clientId: "client-1",
        workDate: "2026-02-22",
      }),
    ).toThrowError("WORK_LOG_INVALID_PERSON_ID");

    expect(() =>
      WorkLog.create({
        id: "work-log-1",
        personId: "person-1",
        clientId: "   ",
        workDate: "2026-02-22",
      }),
    ).toThrowError("WORK_LOG_INVALID_CLIENT_ID");

    expect(() =>
      WorkLog.create({
        id: "work-log-1",
        personId: "person-1",
        clientId: "client-1",
        workDate: "22-02-2026",
      }),
    ).toThrowError("WORK_LOG_INVALID_DATE");

    expect(() =>
      WorkLog.create({
        id: "work-log-1",
        personId: "person-1",
        clientId: "client-1",
        workDate: "2026-02-30",
      }),
    ).toThrowError("WORK_LOG_INVALID_DATE");
  });

  it("adds and removes items while mutable", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      clientId: "client-1",
      workDate: "2026-02-22",
    });

    const first = createItem("item-1");
    const second = createItem("item-2");
    workLog.addItem(first);
    workLog.addItem(second);

    expect(workLog.items).toHaveLength(2);
    expect(workLog.totalCents).toBe(first.totalCents + second.totalCents);
    expect(workLog.startAt?.toISOString()).toBe("2026-02-22T09:00:00.000Z");
    expect(workLog.endAt?.toISOString()).toBe("2026-02-22T12:00:00.000Z");
    expect(workLog.totalBreakMinutes).toBe(60);
    expect(workLog.totalWorkedMinutes).toBe(360);
    expect(workLog.totalPayableMinutes).toBe(300);

    workLog.removeItem("item-1");
    expect(workLog.items).toHaveLength(1);
  });

  it("throws when removing non-existing item", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      clientId: "client-1",
      workDate: "2026-02-22",
    });

    expect(() => workLog.removeItem("item-x")).toThrowError("WORK_LOG_ITEM_NOT_FOUND");
  });

  it("applies daily additional in total", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      clientId: "client-1",
      workDate: "2026-02-22",
      dailyAdditionalCents: 5000,
    });

    const item = WorkLogItem.create({
      id: "item-1",
      location: "Site 1",
      startAt: "2026-02-22T09:00:00.000Z",
      endAt: "2026-02-22T12:00:00.000Z",
      breakMinutes: 30,
      hourlyRateCents: 10000,
      additionalCents: -1000,
    });
    workLog.addItem(item);

    expect(workLog.totalCents).toBe(item.totalCents + 5000);

    workLog.setDailyAdditional(2000);
    expect(workLog.totalCents).toBe(item.totalCents + 2000);
  });

  it("locks modifications after status is invoiced", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      clientId: "client-1",
      workDate: "2026-02-22",
    });

    workLog.addItem(createItem("item-1"));
    workLog.markLinked();
    workLog.markInvoiced();

    expect(() => workLog.addItem(createItem("item-1"))).toThrowError("WORK_LOG_LOCKED");
    expect(() => workLog.removeItem("item-1")).toThrowError("WORK_LOG_LOCKED");
    expect(() => workLog.setDailyAdditional(1000)).toThrowError("WORK_LOG_LOCKED");
  });

  it("blocks duplicate item ids", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      clientId: "client-1",
      workDate: "2026-02-22",
    });

    workLog.addItem(createItem("item-1"));

    expect(() => workLog.addItem(createItem("item-1"))).toThrowError(
      "WORK_LOG_ITEM_ALREADY_EXISTS",
    );
  });

  it("validates daily additional fields", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      clientId: "client-1",
      workDate: "2026-02-22",
    });

    expect(() => workLog.setDailyAdditional(1000.5)).toThrowError(
      "WORK_LOG_INVALID_ADDITIONAL_AMOUNT",
    );
  });

  it("allows only draft -> linked -> invoiced status flow", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      clientId: "client-1",
      workDate: "2026-02-22",
    });

    expect(() => workLog.markLinked()).toThrowError("WORK_LOG_EMPTY");
    expect(() => workLog.markInvoiced()).toThrowError(
      "WORK_LOG_INVALID_STATUS_TRANSITION",
    );

    workLog.addItem(createItem("item-1"));
    workLog.markLinked();
    workLog.markInvoiced();

    expect(() => workLog.markLinked()).toThrowError(
      "WORK_LOG_INVALID_STATUS_TRANSITION",
    );
    expect(() => workLog.markInvoiced()).toThrowError(
      "WORK_LOG_INVALID_STATUS_TRANSITION",
    );
  });

  it("validates notes length", () => {
    expect(() =>
      WorkLog.create({
        id: "work-log-1",
        personId: "person-1",
        clientId: "client-1",
        workDate: "2026-02-22",
        notes: "a".repeat(1001),
      }),
    ).toThrowError("WORK_LOG_INVALID_NOTES");
  });

  it("rejects item when period does not match work log date", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      clientId: "client-1",
      workDate: "2026-02-22",
    });

    const item = WorkLogItem.create({
      id: "item-1",
      location: "Site 1",
      startAt: "2026-02-23T09:00:00.000Z",
      endAt: "2026-02-23T12:00:00.000Z",
      breakMinutes: 30,
      hourlyRateCents: 10000,
    });

    expect(() => workLog.addItem(item)).toThrowError("WORK_LOG_ITEM_DATE_MISMATCH");
  });

  it("rejects item when period crosses day boundary", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      clientId: "client-1",
      workDate: "2026-02-22",
    });

    const item = WorkLogItem.create({
      id: "item-1",
      location: "Site 1",
      startAt: "2026-02-22T23:00:00.000Z",
      endAt: "2026-02-23T00:00:00.000Z",
      breakMinutes: 0,
      hourlyRateCents: 10000,
    });

    expect(() => workLog.addItem(item)).toThrowError("WORK_LOG_ITEM_DATE_MISMATCH");
  });
});
