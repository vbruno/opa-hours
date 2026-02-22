import { Duration } from "./duration.js";

export class WorkPeriod {
  private constructor(
    public readonly startAt: Date,
    public readonly endAt: Date,
  ) {}

  public static create(input: { startAt: Date | string; endAt: Date | string }): WorkPeriod {
    const startAt = input.startAt instanceof Date ? input.startAt : new Date(input.startAt);
    const endAt = input.endAt instanceof Date ? input.endAt : new Date(input.endAt);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new Error("WORK_LOG_INVALID_PERIOD");
    }

    if (endAt.getTime() <= startAt.getTime()) {
      throw new Error("WORK_LOG_INVALID_PERIOD");
    }

    return new WorkPeriod(startAt, endAt);
  }

  public getWorkedDuration(): Duration {
    const diffMinutes = Math.floor(
      (this.endAt.getTime() - this.startAt.getTime()) / (1000 * 60),
    );

    return Duration.fromMinutes(diffMinutes);
  }
}
