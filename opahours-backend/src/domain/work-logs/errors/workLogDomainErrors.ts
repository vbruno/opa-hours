export const workLogDomainErrorMessages = {
  WORK_LOG_INVALID_ID: "Work log id is required",
  WORK_LOG_INVALID_PERSON_ID: "Person id is required",
  WORK_LOG_INVALID_DATE: "Work date must follow YYYY-MM-DD format",
  WORK_LOG_ITEM_ALREADY_EXISTS: "Work log item already exists",
  WORK_LOG_ITEM_NOT_FOUND: "Work log item not found",
  WORK_LOG_ADDITIONAL_INVALID_ID: "Additional id is required",
  WORK_LOG_ADDITIONAL_INVALID_DESCRIPTION: "Additional description is required",
  WORK_LOG_INVALID_ADDITIONAL_AMOUNT: "Additional amount must be an integer in cents",
  WORK_LOG_ADDITIONAL_ALREADY_EXISTS: "Additional already exists",
  WORK_LOG_ADDITIONAL_NOT_FOUND: "Additional not found",
  WORK_LOG_INVALID_STATUS_TRANSITION: "Invalid work log status transition",
  WORK_LOG_LOCKED: "Work log is invoiced and cannot be changed",
  WORK_LOG_ITEM_INVALID_ID: "Work log item id is required",
  WORK_LOG_ITEM_INVALID_DESCRIPTION: "Work log item description is required",
  WORK_LOG_INVALID_DURATION: "Duration must be a non-negative integer in minutes",
  WORK_LOG_INVALID_BREAK_DURATION: "Break duration cannot exceed worked duration",
  WORK_LOG_INVALID_HOURLY_RATE: "Hourly rate must be a positive integer in cents",
  WORK_LOG_INVALID_PERIOD_TIMEZONE: "Datetime must include an explicit timezone",
  WORK_LOG_INVALID_PERIOD: "Work period is invalid",
  WORK_LOG_INVALID_PERIOD_PRECISION: "Work period must be minute-based",
  WORK_LOG_DURATION_EXCEEDS_LIMIT: "Work period cannot exceed 24 hours",
  WORK_LOG_INVALID_DAILY_TOTAL: "Daily total cannot be negative",
} as const;

export type WorkLogDomainErrorCode = keyof typeof workLogDomainErrorMessages;

export class WorkLogDomainError extends Error {
  public readonly code: WorkLogDomainErrorCode;
  public readonly details: Record<string, unknown> | null;

  public constructor(
    code: WorkLogDomainErrorCode,
    details: Record<string, unknown> | null = null,
  ) {
    super(`${code}: ${workLogDomainErrorMessages[code]}`);
    this.name = "WorkLogDomainError";
    this.code = code;
    this.details = details;
  }
}

export const throwWorkLogDomainError = (
  code: WorkLogDomainErrorCode,
  details: Record<string, unknown> | null = null,
): never => {
  throw new WorkLogDomainError(code, details);
};
