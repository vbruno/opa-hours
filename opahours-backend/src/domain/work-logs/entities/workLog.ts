import { calculateDailyTotalCents } from "../rules/calculators.js";
import type { WorkLogItem } from "./workLogItem.js";

export type WorkLogStatus = "draft" | "linked" | "invoiced";
export type WorkLogAdditional = {
  id: string;
  description: string;
  cents: number;
};

export class WorkLog {
  private readonly entries: WorkLogItem[] = [];
  private readonly additions: WorkLogAdditional[] = [];
  private statusValue: WorkLogStatus;

  private constructor(
    public readonly id: string,
    public readonly personId: string,
    public readonly workDate: string,
    status: WorkLogStatus,
  ) {
    this.statusValue = status;
  }

  public static create(input: {
    id: string;
    personId: string;
    workDate: string;
    status?: WorkLogStatus;
  }): WorkLog {
    if (!input.id.trim()) {
      throw new Error("WORK_LOG_INVALID_ID");
    }

    if (!input.personId.trim()) {
      throw new Error("WORK_LOG_INVALID_PERSON_ID");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.workDate)) {
      throw new Error("WORK_LOG_INVALID_DATE");
    }

    return new WorkLog(
      input.id,
      input.personId,
      input.workDate,
      input.status ?? "draft",
    );
  }

  public get status(): WorkLogStatus {
    return this.statusValue;
  }

  public get items(): readonly WorkLogItem[] {
    return this.entries;
  }

  public get additionals(): readonly WorkLogAdditional[] {
    return this.additions;
  }

  public get totalCents(): number {
    return calculateDailyTotalCents(this.entries, this.additions);
  }

  public addItem(item: WorkLogItem): void {
    this.ensureMutable();

    const alreadyExists = this.entries.some((entry) => entry.id === item.id);
    if (alreadyExists) {
      throw new Error("WORK_LOG_ITEM_ALREADY_EXISTS");
    }

    this.entries.push(item);
  }

  public removeItem(itemId: string): void {
    this.ensureMutable();

    const index = this.entries.findIndex((entry) => entry.id === itemId);
    if (index === -1) {
      throw new Error("WORK_LOG_ITEM_NOT_FOUND");
    }

    this.entries.splice(index, 1);
  }

  public addAdditional(input: WorkLogAdditional): void {
    this.ensureMutable();

    if (!input.id.trim()) {
      throw new Error("WORK_LOG_ADDITIONAL_INVALID_ID");
    }

    if (!input.description.trim()) {
      throw new Error("WORK_LOG_ADDITIONAL_INVALID_DESCRIPTION");
    }

    if (!Number.isInteger(input.cents)) {
      throw new Error("WORK_LOG_INVALID_ADDITIONAL_AMOUNT");
    }

    const alreadyExists = this.additions.some((item) => item.id === input.id);
    if (alreadyExists) {
      throw new Error("WORK_LOG_ADDITIONAL_ALREADY_EXISTS");
    }

    this.additions.push({
      id: input.id,
      description: input.description.trim(),
      cents: input.cents,
    });
  }

  public removeAdditional(additionalId: string): void {
    this.ensureMutable();

    const index = this.additions.findIndex((item) => item.id === additionalId);
    if (index === -1) {
      throw new Error("WORK_LOG_ADDITIONAL_NOT_FOUND");
    }

    this.additions.splice(index, 1);
  }

  public markLinked(): void {
    if (this.statusValue === "invoiced") {
      throw new Error("WORK_LOG_INVALID_STATUS_TRANSITION");
    }

    this.statusValue = "linked";
  }

  public markInvoiced(): void {
    this.statusValue = "invoiced";
  }

  private ensureMutable(): void {
    if (this.statusValue === "invoiced") {
      throw new Error("WORK_LOG_LOCKED");
    }
  }
}
