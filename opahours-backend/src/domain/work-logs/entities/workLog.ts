import { calculateDailyTotalCents } from "../rules/calculators.js";
import type { WorkLogItem } from "./workLogItem.js";
import { throwWorkLogDomainError } from "../errors/workLogDomainErrors.js";

export type WorkLogStatus = "draft" | "linked" | "invoiced";

const isValidWorkDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
};

export class WorkLog {
  private readonly entries: WorkLogItem[] = [];
  private statusValue: WorkLogStatus;
  private dailyAdditionalCentsValue: number;

  private constructor(
    public readonly id: string,
    public readonly personId: string,
    public readonly clientId: string,
    public readonly workDate: string,
    public readonly notes: string | null,
    dailyAdditionalCents: number,
    status: WorkLogStatus,
  ) {
    this.dailyAdditionalCentsValue = dailyAdditionalCents;
    this.statusValue = status;
  }

  public static create(input: {
    id: string;
    personId: string;
    clientId: string;
    workDate: string;
    notes?: string | null;
    dailyAdditionalCents?: number;
    status?: WorkLogStatus;
  }): WorkLog {
    if (!input.id.trim()) {
      throwWorkLogDomainError("WORK_LOG_INVALID_ID");
    }

    if (!input.personId.trim()) {
      throwWorkLogDomainError("WORK_LOG_INVALID_PERSON_ID");
    }

    if (!input.clientId.trim()) {
      throwWorkLogDomainError("WORK_LOG_INVALID_CLIENT_ID");
    }

    if (!isValidWorkDate(input.workDate)) {
      throwWorkLogDomainError("WORK_LOG_INVALID_DATE");
    }

    const normalizedNotes = input.notes?.trim() ?? null;
    if (normalizedNotes !== null && normalizedNotes.length > 1000) {
      throwWorkLogDomainError("WORK_LOG_INVALID_NOTES");
    }

    const dailyAdditionalCents = input.dailyAdditionalCents ?? 0;
    if (!Number.isInteger(dailyAdditionalCents)) {
      throwWorkLogDomainError("WORK_LOG_INVALID_ADDITIONAL_AMOUNT");
    }

    return new WorkLog(
      input.id,
      input.personId,
      input.clientId,
      input.workDate,
      normalizedNotes,
      dailyAdditionalCents,
      input.status ?? "draft",
    );
  }

  public get status(): WorkLogStatus {
    return this.statusValue;
  }

  public get items(): readonly WorkLogItem[] {
    return this.entries;
  }

  public get dailyAdditionalCents(): number {
    return this.dailyAdditionalCentsValue;
  }

  public get totalCents(): number {
    return calculateDailyTotalCents(this.entries, this.dailyAdditionalCentsValue);
  }

  public get startAt(): Date | null {
    if (this.entries.length === 0) {
      return null;
    }

    return this.entries.reduce((earliest, item) =>
      item.period.startAt.getTime() < earliest.getTime() ? item.period.startAt : earliest,
    this.entries[0]!.period.startAt);
  }

  public get endAt(): Date | null {
    if (this.entries.length === 0) {
      return null;
    }

    return this.entries.reduce((latest, item) =>
      item.period.endAt.getTime() > latest.getTime() ? item.period.endAt : latest,
    this.entries[0]!.period.endAt);
  }

  public get totalBreakMinutes(): number {
    return this.entries.reduce((acc, item) => acc + item.breakDuration.minutes, 0);
  }

  public get totalWorkedMinutes(): number {
    return this.entries.reduce((acc, item) => acc + item.period.getWorkedDuration().minutes, 0);
  }

  public get totalPayableMinutes(): number {
    return this.entries.reduce((acc, item) => acc + item.payableDuration.minutes, 0);
  }

  public setDailyAdditional(cents: number): void {
    this.ensureMutable();

    if (!Number.isInteger(cents)) {
      throwWorkLogDomainError("WORK_LOG_INVALID_ADDITIONAL_AMOUNT");
    }

    this.dailyAdditionalCentsValue = cents;
  }

  public addItem(item: WorkLogItem): void {
    this.ensureMutable();

    if (!item.isSingleDay || item.referenceDate !== this.workDate) {
      throwWorkLogDomainError("WORK_LOG_ITEM_DATE_MISMATCH");
    }

    const alreadyExists = this.entries.some((entry) => entry.id === item.id);
    if (alreadyExists) {
      throwWorkLogDomainError("WORK_LOG_ITEM_ALREADY_EXISTS");
    }

    this.entries.push(item);
  }

  public removeItem(itemId: string): void {
    this.ensureMutable();

    const index = this.entries.findIndex((entry) => entry.id === itemId);
    if (index === -1) {
      throwWorkLogDomainError("WORK_LOG_ITEM_NOT_FOUND");
    }

    this.entries.splice(index, 1);
  }

  public markLinked(): void {
    if (this.entries.length === 0) {
      throwWorkLogDomainError("WORK_LOG_EMPTY");
    }

    if (this.statusValue !== "draft") {
      throwWorkLogDomainError("WORK_LOG_INVALID_STATUS_TRANSITION");
    }

    this.statusValue = "linked";
  }

  public markInvoiced(): void {
    if (this.statusValue !== "linked") {
      throwWorkLogDomainError("WORK_LOG_INVALID_STATUS_TRANSITION");
    }

    this.statusValue = "invoiced";
  }

  private ensureMutable(): void {
    if (this.statusValue === "invoiced") {
      throwWorkLogDomainError("WORK_LOG_LOCKED");
    }
  }
}
