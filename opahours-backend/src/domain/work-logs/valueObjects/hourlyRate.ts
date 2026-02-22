export class HourlyRate {
  private constructor(private readonly centsValue: number) {}

  public static fromCents(cents: number): HourlyRate {
    if (!Number.isFinite(cents) || !Number.isInteger(cents) || cents <= 0) {
      throw new Error("WORK_LOG_INVALID_HOURLY_RATE");
    }

    return new HourlyRate(cents);
  }

  public get cents(): number {
    return this.centsValue;
  }
}
