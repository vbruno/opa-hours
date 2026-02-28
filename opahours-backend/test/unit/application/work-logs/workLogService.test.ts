import { describe, expect, it } from "vitest";

import { WorkLogService } from "../../../../src/application/work-logs/services/workLogService.js";
import type {
  WorkLogListFilters,
  WorkLogRepository,
} from "../../../../src/application/work-logs/ports/workLogRepository.js";
import { WorkLog } from "../../../../src/domain/work-logs/entities/workLog.js";
import { WorkLogItem } from "../../../../src/domain/work-logs/entities/workLogItem.js";

class FakeWorkLogRepository implements WorkLogRepository {
  public items = new Map<string, WorkLog>();

  public async findById(id: string): Promise<WorkLog | null> {
    return this.items.get(id) ?? null;
  }

  public async findByPersonClientAndDate(
    personId: string,
    clientId: string,
    date: string,
  ): Promise<WorkLog | null> {
    for (const workLog of this.items.values()) {
      if (
        workLog.personId === personId &&
        workLog.clientId === clientId &&
        workLog.workDate === date
      ) {
        return workLog;
      }
    }

    return null;
  }

  public async list(filters: WorkLogListFilters): Promise<WorkLog[]> {
    return [...this.items.values()].filter((workLog) => {
      if (workLog.personId !== filters.personId) return false;
      if (filters.clientId && workLog.clientId !== filters.clientId)
        return false;
      if (filters.status && workLog.status !== filters.status) return false;
      if (filters.from && workLog.workDate < filters.from) return false;
      if (filters.to && workLog.workDate > filters.to) return false;
      return true;
    });
  }

  public async save(workLog: WorkLog): Promise<void> {
    this.items.set(workLog.id, workLog);
  }

  public async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

const createDraft = (id: string, workDate = "2026-02-27"): WorkLog =>
  WorkLog.rehydrate({
    id,
    personId: "person-1",
    clientId: "client-1",
    workDate,
    status: "draft",
    items: [
      WorkLogItem.create({
        id: `${id}-item-1`,
        location: "Client HQ",
        startAt: `${workDate}T09:00:00.000Z`,
        endAt: `${workDate}T12:00:00.000Z`,
        breakMinutes: 30,
        hourlyRateCents: 10000,
      }),
    ],
  });

describe("workLog service", () => {
  it("creates a work log", async () => {
    const repository = new FakeWorkLogRepository();
    const service = new WorkLogService(repository);

    const workLog = await service.createWorkLog({
      personId: "person-1",
      clientId: "client-1",
      workDate: "2026-02-27",
      items: [
        {
          location: "Client HQ",
          startAt: "2026-02-27T09:00:00.000Z",
          endAt: "2026-02-27T12:00:00.000Z",
          breakMinutes: 30,
          hourlyRateCents: 10000,
        },
      ],
    });

    expect(workLog.clientId).toBe("client-1");
    expect(workLog.items).toHaveLength(1);
    expect(repository.items.size).toBe(1);
  });

  it("rejects duplicate create by person client and date", async () => {
    const repository = new FakeWorkLogRepository();
    const existing = createDraft("work-log-1");
    await repository.save(existing);

    const service = new WorkLogService(repository);

    await expect(() =>
      service.createWorkLog({
        personId: "person-1",
        clientId: "client-1",
        workDate: "2026-02-27",
      }),
    ).rejects.toMatchObject({
      code: "WORK_LOG_ALREADY_EXISTS",
      statusCode: 409,
    });
  });

  it("returns not found when fetching missing work log", async () => {
    const repository = new FakeWorkLogRepository();
    const service = new WorkLogService(repository);

    await expect(() => service.getWorkLogById("missing")).rejects.toMatchObject(
      {
        code: "WORK_LOG_NOT_FOUND",
        statusCode: 404,
      },
    );
  });

  it("updates work log fields and items", async () => {
    const repository = new FakeWorkLogRepository();
    const existing = createDraft("work-log-1");
    await repository.save(existing);

    const service = new WorkLogService(repository);

    const updated = await service.updateWorkLog("work-log-1", {
      notes: "Updated note",
      dailyAdditionalCents: 2000,
      items: [
        {
          id: "item-1",
          location: "Client Site 2",
          startAt: "2026-02-27T13:00:00.000Z",
          endAt: "2026-02-27T15:00:00.000Z",
          breakMinutes: 15,
          hourlyRateCents: 12000,
        },
      ],
    });

    expect(updated.notes).toBe("Updated note");
    expect(updated.dailyAdditionalCents).toBe(2000);
    expect(updated.items[0]?.location).toBe("Client Site 2");
  });

  it("blocks deletion when work log is invoiced", async () => {
    const repository = new FakeWorkLogRepository();
    const invoiced = WorkLog.rehydrate({
      id: "work-log-1",
      personId: "person-1",
      clientId: "client-1",
      workDate: "2026-02-27",
      status: "invoiced",
      items: [
        WorkLogItem.create({
          id: "item-1",
          location: "Client HQ",
          startAt: "2026-02-27T09:00:00.000Z",
          endAt: "2026-02-27T12:00:00.000Z",
          breakMinutes: 30,
          hourlyRateCents: 10000,
        }),
      ],
    });
    await repository.save(invoiced);

    const service = new WorkLogService(repository);

    await expect(() =>
      service.deleteWorkLog("work-log-1"),
    ).rejects.toMatchObject({
      code: "WORK_LOG_LOCKED",
    });
  });
});
