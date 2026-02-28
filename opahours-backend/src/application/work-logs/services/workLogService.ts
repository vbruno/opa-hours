import { randomUUID } from "node:crypto";

import type {
  WorkLogListFilters,
  WorkLogRepository,
} from "../ports/workLogRepository.js";
import { AppError } from "../../shared/errors/appError.js";
import { errorMessages } from "../../shared/errors/errorMessages.js";
import { WorkLog } from "../../../domain/work-logs/entities/workLog.js";
import { WorkLogItem } from "../../../domain/work-logs/entities/workLogItem.js";
import { throwWorkLogDomainError } from "../../../domain/work-logs/errors/workLogDomainErrors.js";
import { DrizzleWorkLogRepository } from "../../../infrastructure/db/repositories/workLogRepository.drizzle.js";

export interface WorkLogItemInput {
  id?: string;
  location: string;
  startAt: Date | string;
  endAt: Date | string;
  breakMinutes: number;
  hourlyRateCents: number;
  additionalCents?: number;
  notes?: string | null;
}

export interface CreateWorkLogInput {
  personId: string;
  clientId: string;
  workDate: string;
  notes?: string | null;
  dailyAdditionalCents?: number;
  items?: WorkLogItemInput[];
}

export interface UpdateWorkLogInput {
  personId?: string;
  clientId?: string;
  workDate?: string;
  notes?: string | null;
  dailyAdditionalCents?: number;
  items?: WorkLogItemInput[];
}

const toDomainItems = (items: WorkLogItemInput[] = []): WorkLogItem[] =>
  items.map((item) =>
    WorkLogItem.create({
      id: item.id ?? randomUUID(),
      location: item.location,
      startAt: item.startAt,
      endAt: item.endAt,
      breakMinutes: item.breakMinutes,
      hourlyRateCents: item.hourlyRateCents,
      additionalCents: item.additionalCents,
      notes: item.notes,
    }),
  );

export class WorkLogService {
  private readonly repository: WorkLogRepository;

  public constructor(
    repository: WorkLogRepository = new DrizzleWorkLogRepository(),
  ) {
    this.repository = repository;
  }

  public async createWorkLog(input: CreateWorkLogInput): Promise<WorkLog> {
    const existing = await this.repository.findByPersonClientAndDate(
      input.personId,
      input.clientId,
      input.workDate,
    );

    if (existing) {
      throw new AppError(
        "WORK_LOG_ALREADY_EXISTS",
        errorMessages.WORK_LOG_ALREADY_EXISTS,
        409,
      );
    }

    const workLog = WorkLog.rehydrate({
      id: randomUUID(),
      personId: input.personId,
      clientId: input.clientId,
      workDate: input.workDate,
      notes: input.notes,
      dailyAdditionalCents: input.dailyAdditionalCents,
      status: "draft",
      items: toDomainItems(input.items),
    });

    await this.repository.save(workLog);

    return workLog;
  }

  public async getWorkLogById(id: string): Promise<WorkLog> {
    const workLog = await this.repository.findById(id);

    if (!workLog) {
      throw new AppError(
        "WORK_LOG_NOT_FOUND",
        errorMessages.WORK_LOG_NOT_FOUND,
        404,
      );
    }

    return workLog;
  }

  public listWorkLogs(filters: WorkLogListFilters): Promise<WorkLog[]> {
    return this.repository.list(filters);
  }

  public async updateWorkLog(
    id: string,
    input: UpdateWorkLogInput,
  ): Promise<WorkLog> {
    const current = await this.repository.findById(id);

    if (!current) {
      throw new AppError(
        "WORK_LOG_NOT_FOUND",
        errorMessages.WORK_LOG_NOT_FOUND,
        404,
      );
    }

    const nextPersonId = input.personId ?? current.personId;
    const nextClientId = input.clientId ?? current.clientId;
    const nextWorkDate = input.workDate ?? current.workDate;

    const duplicate = await this.repository.findByPersonClientAndDate(
      nextPersonId,
      nextClientId,
      nextWorkDate,
    );

    if (duplicate && duplicate.id !== id) {
      throw new AppError(
        "WORK_LOG_ALREADY_EXISTS",
        errorMessages.WORK_LOG_ALREADY_EXISTS,
        409,
      );
    }

    const nextItems =
      input.items !== undefined
        ? toDomainItems(input.items)
        : [...current.items];

    const updated = WorkLog.rehydrate({
      id,
      personId: nextPersonId,
      clientId: nextClientId,
      workDate: nextWorkDate,
      notes: input.notes !== undefined ? input.notes : current.notes,
      dailyAdditionalCents:
        input.dailyAdditionalCents ?? current.dailyAdditionalCents,
      status: current.status,
      items: nextItems,
    });

    await this.repository.save(updated);

    return updated;
  }

  public async deleteWorkLog(id: string): Promise<void> {
    const current = await this.repository.findById(id);

    if (!current) {
      throw new AppError(
        "WORK_LOG_NOT_FOUND",
        errorMessages.WORK_LOG_NOT_FOUND,
        404,
      );
    }

    if (current.status === "invoiced") {
      throwWorkLogDomainError("WORK_LOG_LOCKED");
    }

    await this.repository.delete(id);
  }
}
