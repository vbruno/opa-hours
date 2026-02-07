import { AppError } from "@/application/shared/errors/appError";

export class Duration {
  public readonly minutes: number;

  public constructor(minutes: number) {
    if (!Number.isInteger(minutes) || minutes < 0) {
      throw new AppError("INVALID_DURATION", "Duration must be a non-negative integer", 422);
    }

    this.minutes = minutes;
  }
}
