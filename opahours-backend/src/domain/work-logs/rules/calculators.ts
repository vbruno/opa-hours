import type { Duration } from "../valueObjects/duration.js";
import type { HourlyRate } from "../valueObjects/hourlyRate.js";
import type { WorkPeriod } from "../valueObjects/workPeriod.js";

export const calculatePayableDuration = (
  period: WorkPeriod,
  breakDuration: Duration,
): Duration => period.getWorkedDuration().subtract(breakDuration);

export const calculateItemTotalCents = (
  payableDuration: Duration,
  hourlyRate: HourlyRate,
): number => {
  const value = (payableDuration.minutes / 60) * hourlyRate.cents;
  return Math.round(value);
};

export const calculateWorkLogTotal = (
  items: ReadonlyArray<{ totalCents: number }>,
): number => items.reduce((acc, item) => acc + item.totalCents, 0);

export const calculateAdditionalTotal = (
  additions: ReadonlyArray<{ cents: number }>,
): number => {
  for (const addition of additions) {
    if (!Number.isInteger(addition.cents)) {
      throw new Error("WORK_LOG_INVALID_ADDITIONAL_AMOUNT");
    }
  }

  return additions.reduce((acc, addition) => acc + addition.cents, 0);
};

export const calculateDailyTotalCents = (
  items: ReadonlyArray<{ totalCents: number }>,
  additions: ReadonlyArray<{ cents: number }>,
): number => {
  const baseTotal = calculateWorkLogTotal(items);
  const additionalTotal = calculateAdditionalTotal(additions);
  const total = baseTotal + additionalTotal;

  if (total < 0) {
    throw new Error("WORK_LOG_INVALID_DAILY_TOTAL");
  }

  return total;
};
