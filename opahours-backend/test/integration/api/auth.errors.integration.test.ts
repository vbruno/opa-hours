import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { buildServer } from "../../../src/api/server.js";
import {
  closeTestDatabase,
  resetAuthTables,
  setupTestDatabase,
} from "../../helpers/testDatabase.js";
import { bootstrapUser, seedAuthSession } from "../../helpers/auth.js";

describe.sequential("Auth errors integration (test DB)", () => {
  let app: ReturnType<typeof buildServer> | null = null;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await resetAuthTables();
    app = buildServer();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  it("returns AUTH_INVALID_CREDENTIALS for wrong password", async () => {
    await bootstrapUser(app!);

    const response = await app!.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@example.com",
        password: "wrong-password",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("returns AUTH_MISSING_REFRESH_TOKEN when cookie is not present", async () => {
    const response = await app!.inject({
      method: "POST",
      url: "/auth/refresh",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe("AUTH_MISSING_REFRESH_TOKEN");
    expect(response.headers["set-cookie"]).toContain("Max-Age=0");
  });

  it("returns AUTH_INVALID_REFRESH_TOKEN for tampered cookie token", async () => {
    const { login, refreshCookie } = await seedAuthSession(app!);
    expect(login.statusCode).toBe(200);
    const tamperedCookie = refreshCookie.replace(
      /refreshToken=[^;]+/,
      "refreshToken=invalid-token",
    );

    const response = await app!.inject({
      method: "POST",
      url: "/auth/refresh",
      headers: { cookie: tamperedCookie },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe("AUTH_INVALID_REFRESH_TOKEN");
  });

  it("returns AUTH_MISSING_ACCESS_TOKEN for /auth/me without bearer token", async () => {
    const response = await app!.inject({
      method: "GET",
      url: "/auth/me",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe("AUTH_MISSING_ACCESS_TOKEN");
  });
});
