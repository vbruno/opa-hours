import { calculateItemTotalCents, calculatePayableDuration } from "../rules/calculators.js";
import { Duration } from "../valueObjects/duration.js";
import { HourlyRate } from "../valueObjects/hourlyRate.js";
import { WorkPeriod } from "../valueObjects/workPeriod.js";
import { throwWorkLogDomainError } from "../errors/workLogDomainErrors.js";

export class WorkLogItem {
  public readonly payableDuration: Duration;
  public readonly totalCents: number;

  private constructor(
    public readonly id: string,
    public readonly description: string,
    public readonly period: WorkPeriod,
    public readonly breakDuration: Duration,
    public readonly hourlyRate: HourlyRate,
  ) {
    this.payableDuration = calculatePayableDuration(period, breakDuration);
    this.totalCents = calculateItemTotalCents(this.payableDuration, hourlyRate);
  }

  public static create(input: {
    id: string;
    description: string;
    startAt: Date | string;
    endAt: Date | string;
    breakMinutes: number;
    hourlyRateCents: number;
  }): WorkLogItem {
    if (!input.id.trim()) {
      throwWorkLogDomainError("WORK_LOG_ITEM_INVALID_ID");
    }

    if (!input.description.trim()) {
      throwWorkLogDomainError("WORK_LOG_ITEM_INVALID_DESCRIPTION");
    }

    const period = WorkPeriod.create({
      startAt: input.startAt,
      endAt: input.endAt,
    });

    const breakDuration = Duration.fromMinutes(input.breakMinutes);
    const hourlyRate = HourlyRate.fromCents(input.hourlyRateCents);

    return new WorkLogItem(
      input.id,
      input.description.trim(),
      period,
      breakDuration,
      hourlyRate,
    );
  }
}
