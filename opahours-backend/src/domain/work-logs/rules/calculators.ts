import { Duration } from "../valueObjects/duration.js";
import { HourlyRate } from "../valueObjects/hourlyRate.js";
import { WorkPeriod } from "../valueObjects/workPeriod.js";

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
