import { describe, expect, it } from "vitest";

import { WorkLog } from "../../../../../src/domain/work-logs/entities/workLog.js";
import { WorkLogItem } from "../../../../../src/domain/work-logs/entities/workLogItem.js";

const createItem = (id: string) =>
  WorkLogItem.create({
    id,
    description: `Shift ${id}`,
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
      workDate: "2026-02-22",
    });

    expect(workLog.id).toBe("work-log-1");
    expect(workLog.personId).toBe("person-1");
    expect(workLog.workDate).toBe("2026-02-22");
    expect(workLog.status).toBe("draft");
  });

  it("rejects invalid base fields", () => {
    expect(() =>
      WorkLog.create({
        id: "   ",
        personId: "person-1",
        workDate: "2026-02-22",
      }),
    ).toThrowError("WORK_LOG_INVALID_ID");

    expect(() =>
      WorkLog.create({
        id: "work-log-1",
        personId: "   ",
        workDate: "2026-02-22",
      }),
    ).toThrowError("WORK_LOG_INVALID_PERSON_ID");

    expect(() =>
      WorkLog.create({
        id: "work-log-1",
        personId: "person-1",
        workDate: "22-02-2026",
      }),
    ).toThrowError("WORK_LOG_INVALID_DATE");

    expect(() =>
      WorkLog.create({
        id: "work-log-1",
        personId: "person-1",
        workDate: "2026-02-30",
      }),
    ).toThrowError("WORK_LOG_INVALID_DATE");
  });

  it("adds and removes items while mutable", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      workDate: "2026-02-22",
    });

    const first = createItem("item-1");
    const second = createItem("item-2");
    workLog.addItem(first);
    workLog.addItem(second);

    expect(workLog.items).toHaveLength(2);
    expect(workLog.totalCents).toBe(first.totalCents + second.totalCents);

    workLog.removeItem("item-1");
    expect(workLog.items).toHaveLength(1);
  });

  it("throws when removing non-existing item", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      workDate: "2026-02-22",
    });

    expect(() => workLog.removeItem("item-x")).toThrowError("WORK_LOG_ITEM_NOT_FOUND");
  });

  it("applies daily additions and discounts in total", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      workDate: "2026-02-22",
    });

    const item = createItem("item-1");
    workLog.addItem(item);
    workLog.addAdditional({
      id: "add-1",
      description: "Night shift extra",
      cents: 5000,
    });
    workLog.addAdditional({
      id: "add-2",
      description: "Adjustment discount",
      cents: -1000,
    });

    expect(workLog.totalCents).toBe(item.totalCents + 4000);

    workLog.removeAdditional("add-2");
    expect(workLog.totalCents).toBe(item.totalCents + 5000);
  });

  it("locks modifications after status is invoiced", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      workDate: "2026-02-22",
    });

    workLog.markLinked();
    workLog.markInvoiced();

    expect(() => workLog.addItem(createItem("item-1"))).toThrowError("WORK_LOG_LOCKED");
    expect(() => workLog.removeItem("item-1")).toThrowError("WORK_LOG_LOCKED");
    expect(() =>
      workLog.addAdditional({ id: "add-1", description: "Extra", cents: 1000 }),
    ).toThrowError("WORK_LOG_LOCKED");
    expect(() => workLog.removeAdditional("add-1")).toThrowError("WORK_LOG_LOCKED");
  });

  it("blocks duplicate item ids", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      workDate: "2026-02-22",
    });

    workLog.addItem(createItem("item-1"));

    expect(() => workLog.addItem(createItem("item-1"))).toThrowError(
      "WORK_LOG_ITEM_ALREADY_EXISTS",
    );
  });

  it("blocks duplicate addition ids", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      workDate: "2026-02-22",
    });

    workLog.addAdditional({ id: "add-1", description: "Extra", cents: 1000 });

    expect(() =>
      workLog.addAdditional({ id: "add-1", description: "Another", cents: 2000 }),
    ).toThrowError("WORK_LOG_ADDITIONAL_ALREADY_EXISTS");
  });

  it("validates additional payload fields", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      workDate: "2026-02-22",
    });

    expect(() =>
      workLog.addAdditional({ id: "   ", description: "Extra", cents: 1000 }),
    ).toThrowError("WORK_LOG_ADDITIONAL_INVALID_ID");

    expect(() =>
      workLog.addAdditional({ id: "add-1", description: "   ", cents: 1000 }),
    ).toThrowError("WORK_LOG_ADDITIONAL_INVALID_DESCRIPTION");

    expect(() =>
      workLog.addAdditional({ id: "add-1", description: "Extra", cents: 1000.5 }),
    ).toThrowError("WORK_LOG_INVALID_ADDITIONAL_AMOUNT");
  });

  it("throws when removing non-existing additional", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      workDate: "2026-02-22",
    });

    expect(() => workLog.removeAdditional("add-x")).toThrowError(
      "WORK_LOG_ADDITIONAL_NOT_FOUND",
    );
  });

  it("allows only draft -> linked -> invoiced status flow", () => {
    const workLog = WorkLog.create({
      id: "work-log-1",
      personId: "person-1",
      workDate: "2026-02-22",
    });

    expect(() => workLog.markInvoiced()).toThrowError(
      "WORK_LOG_INVALID_STATUS_TRANSITION",
    );

    workLog.markLinked();
    workLog.markInvoiced();

    expect(() => workLog.markLinked()).toThrowError(
      "WORK_LOG_INVALID_STATUS_TRANSITION",
    );
    expect(() => workLog.markInvoiced()).toThrowError(
      "WORK_LOG_INVALID_STATUS_TRANSITION",
    );
  });
});
