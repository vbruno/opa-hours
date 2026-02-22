import { throwWorkLogDomainError } from "../errors/workLogDomainErrors.js";

export class Duration {
  private constructor(private readonly minutesValue: number) {}

  public static fromMinutes(minutes: number): Duration {
    if (!Number.isFinite(minutes) || !Number.isInteger(minutes) || minutes < 0) {
      throwWorkLogDomainError("WORK_LOG_INVALID_DURATION");
    }

    return new Duration(minutes);
  }

  public get minutes(): number {
    return this.minutesValue;
  }

  public subtract(other: Duration): Duration {
    if (other.minutes > this.minutesValue) {
      throwWorkLogDomainError("WORK_LOG_INVALID_BREAK_DURATION");
    }

    return Duration.fromMinutes(this.minutesValue - other.minutes);
  }
}
