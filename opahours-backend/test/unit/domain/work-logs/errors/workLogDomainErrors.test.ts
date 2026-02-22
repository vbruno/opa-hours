import { describe, expect, it } from "vitest";

import {
  WorkLogDomainError,
  workLogDomainErrorMessages,
} from "../../../../../src/domain/work-logs/errors/workLogDomainErrors.js";

describe("workLog domain errors", () => {
  it("builds standardized error with code and message", () => {
    const error = new WorkLogDomainError("WORK_LOG_INVALID_ID");

    expect(error.name).toBe("WorkLogDomainError");
    expect(error.code).toBe("WORK_LOG_INVALID_ID");
    expect(error.message).toContain("WORK_LOG_INVALID_ID");
    expect(error.message).toContain(workLogDomainErrorMessages.WORK_LOG_INVALID_ID);
  });
});
