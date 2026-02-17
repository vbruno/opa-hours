import { afterEach, describe, expect, it } from "vitest";

import { buildServer } from "../../../src/api/server.js";

describe("Error contract", () => {
  let app: ReturnType<typeof buildServer> | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it("returns standardized payload for AppError", async () => {
    app = buildServer();

    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();

    expect(body).toMatchObject({
      code: "AUTH_MISSING_ACCESS_TOKEN",
      message: "Missing bearer access token",
      details: null,
    });
    expect(typeof body.requestId).toBe("string");
  });

  it("returns standardized payload for validation errors", async () => {
    app = buildServer();

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "not-an-email",
        password: "123",
      },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();

    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.message).toBe("Invalid request payload");
    expect(typeof body.requestId).toBe("string");
    expect(Array.isArray(body.details?.issues)).toBe(true);
    expect(body.details.issues.length).toBeGreaterThan(0);
    expect(body.details.issues[0]).toHaveProperty("code");
    expect(body.details.issues[0]).toHaveProperty("message");
    expect(body.details.issues[0]).toHaveProperty("path");
  });
});
