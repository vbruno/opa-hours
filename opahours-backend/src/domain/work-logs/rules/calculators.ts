export const minutesToDecimalHours = (minutes: number): number => Number((minutes / 60).toFixed(2));

export const calculateWorkLogTotal = (
  durationMin: number,
  hourlyRate: number,
  additionalDay = 0,
  additionalItems = 0,
): number => {
  const base = minutesToDecimalHours(durationMin) * hourlyRate;

  return Number((base + additionalDay + additionalItems).toFixed(2));
};
