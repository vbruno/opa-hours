import { Duration } from "./duration.js";
import { throwWorkLogDomainError } from "../errors/workLogDomainErrors.js";

const MAX_PERIOD_MINUTES = 24 * 60;
const MINUTE_IN_MILLISECONDS = 1000 * 60;

const parseDateInput = (value: Date | string): Date => {
  if (value instanceof Date) {
    return value;
  }

  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
  if (!hasTimezone) {
    throwWorkLogDomainError("WORK_LOG_INVALID_PERIOD_TIMEZONE");
  }

  return new Date(value);
};

export class WorkPeriod {
  private constructor(
    public readonly startAt: Date,
    public readonly endAt: Date,
  ) {}

  public static create(input: {
    startAt: Date | string;
    endAt: Date | string;
  }): WorkPeriod {
    const startAt = parseDateInput(input.startAt);
    const endAt = parseDateInput(input.endAt);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throwWorkLogDomainError("WORK_LOG_INVALID_PERIOD");
    }

    if (endAt.getTime() <= startAt.getTime()) {
      throwWorkLogDomainError("WORK_LOG_INVALID_PERIOD");
    }

    const diffMs = endAt.getTime() - startAt.getTime();
    if (diffMs % MINUTE_IN_MILLISECONDS !== 0) {
      throwWorkLogDomainError("WORK_LOG_INVALID_PERIOD_PRECISION");
    }

    const diffMinutes = diffMs / MINUTE_IN_MILLISECONDS;
    if (diffMinutes > MAX_PERIOD_MINUTES) {
      throwWorkLogDomainError("WORK_LOG_DURATION_EXCEEDS_LIMIT");
    }

    return new WorkPeriod(startAt, endAt);
  }

  public getWorkedDuration(): Duration {
    const diffMinutes =
      (this.endAt.getTime() - this.startAt.getTime()) / MINUTE_IN_MILLISECONDS;

    return Duration.fromMinutes(diffMinutes);
  }
}
