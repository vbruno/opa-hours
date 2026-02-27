import { calculateItemTotalCents, calculatePayableDuration, validateAdditionalAmount } from "../rules/calculators.js";
import { Duration } from "../valueObjects/duration.js";
import { HourlyRate } from "../valueObjects/hourlyRate.js";
import { WorkPeriod } from "../valueObjects/workPeriod.js";
import { throwWorkLogDomainError } from "../errors/workLogDomainErrors.js";

export class WorkLogItem {
  public readonly payableDuration: Duration;
  public readonly totalCents: number;

  private constructor(
    public readonly id: string,
    public readonly location: string,
    public readonly period: WorkPeriod,
    public readonly breakDuration: Duration,
    public readonly hourlyRate: HourlyRate,
    public readonly additionalCents: number,
    public readonly notes: string | null,
  ) {
    this.payableDuration = calculatePayableDuration(period, breakDuration);
    this.totalCents = calculateItemTotalCents(
      this.payableDuration,
      hourlyRate,
      additionalCents,
    );
  }

  public static create(input: {
    id: string;
    location: string;
    startAt: Date | string;
    endAt: Date | string;
    breakMinutes: number;
    hourlyRateCents: number;
    additionalCents?: number;
    notes?: string | null;
  }): WorkLogItem {
    if (!input.id.trim()) {
      throwWorkLogDomainError("WORK_LOG_ITEM_INVALID_ID");
    }

    if (!input.location.trim()) {
      throwWorkLogDomainError("WORK_LOG_ITEM_INVALID_LOCATION");
    }

    const normalizedNotes = input.notes?.trim() ?? null;
    if (normalizedNotes !== null && normalizedNotes.length > 1000) {
      throwWorkLogDomainError("WORK_LOG_ITEM_INVALID_NOTES");
    }

    const period = WorkPeriod.create({
      startAt: input.startAt,
      endAt: input.endAt,
    });

    const breakDuration = Duration.fromMinutes(input.breakMinutes);
    const hourlyRate = HourlyRate.fromCents(input.hourlyRateCents);
    const additionalCents = validateAdditionalAmount(input.additionalCents ?? 0);

    return new WorkLogItem(
      input.id,
      input.location.trim(),
      period,
      breakDuration,
      hourlyRate,
      additionalCents,
      normalizedNotes,
    );
  }

  public get referenceDate(): string {
    return this.period.startAt.toISOString().slice(0, 10);
  }

  public get isSingleDay(): boolean {
    return this.referenceDate === this.period.endAt.toISOString().slice(0, 10);
  }
}
