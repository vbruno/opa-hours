import { AppError } from "@/application/shared/errors/appError";

const HH_MM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class WorkPeriod {
  public readonly start: string;
  public readonly end: string;

  public constructor(start: string, end: string) {
    if (!HH_MM_REGEX.test(start) || !HH_MM_REGEX.test(end)) {
      throw new AppError("INVALID_WORK_PERIOD", "Invalid work period time format", 422);
    }

    const startMin = WorkPeriod.toMinutes(start);
    const endMin = WorkPeriod.toMinutes(end);

    if (endMin <= startMin) {
      throw new AppError("INVALID_WORK_PERIOD", "End time must be after start time", 422);
    }

    this.start = start;
    this.end = end;
  }

  public static toMinutes(value: string): number {
    const [h, m] = value.split(":").map(Number);

    return h * 60 + m;
  }

  public get totalMinutes(): number {
    return WorkPeriod.toMinutes(this.end) - WorkPeriod.toMinutes(this.start);
  }
}
