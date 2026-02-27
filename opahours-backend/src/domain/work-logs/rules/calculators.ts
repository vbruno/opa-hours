import type { Duration } from "../valueObjects/duration.js";
import type { HourlyRate } from "../valueObjects/hourlyRate.js";
import type { WorkPeriod } from "../valueObjects/workPeriod.js";
import { throwWorkLogDomainError } from "../errors/workLogDomainErrors.js";

export const calculatePayableDuration = (
  period: WorkPeriod,
  breakDuration: Duration,
): Duration => period.getWorkedDuration().subtract(breakDuration);

export const calculateItemTotalCents = (
  payableDuration: Duration,
  hourlyRate: HourlyRate,
  itemAdditionalCents = 0,
): number => {
  if (!Number.isInteger(itemAdditionalCents)) {
    throwWorkLogDomainError("WORK_LOG_INVALID_ADDITIONAL_AMOUNT");
  }

  const value = (payableDuration.minutes / 60) * hourlyRate.cents;
  return Math.round(value) + itemAdditionalCents;
};

export const calculateWorkLogTotal = (
  items: ReadonlyArray<{ totalCents: number }>,
): number => items.reduce((acc, item) => acc + item.totalCents, 0);

export const validateAdditionalAmount = (cents: number): number => {
  if (!Number.isInteger(cents)) {
    throwWorkLogDomainError("WORK_LOG_INVALID_ADDITIONAL_AMOUNT");
  }

  return cents;
};

export const calculateDailyTotalCents = (
  items: ReadonlyArray<{ totalCents: number }>,
  dailyAdditionalCents: number,
): number => {
  const baseTotal = calculateWorkLogTotal(items);
  const total = baseTotal + validateAdditionalAmount(dailyAdditionalCents);

  if (total < 0) {
    throwWorkLogDomainError("WORK_LOG_INVALID_DAILY_TOTAL");
  }

  return total;
};
