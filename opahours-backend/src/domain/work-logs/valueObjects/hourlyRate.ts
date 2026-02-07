import { AppError } from "@/application/shared/errors/appError";

export class HourlyRate {
  public readonly value: number;

  public constructor(value: number) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new AppError("INVALID_HOURLY_RATE", "Hourly rate must be greater than zero", 422);
    }

    this.value = Number(value.toFixed(2));
  }
}
