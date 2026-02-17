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
import { seedAuthSession } from "../../helpers/auth.js";

describe.sequential("Auth integration (test DB)", () => {
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

  it("creates user, logs in, refreshes, reads /auth/me and logs out", async () => {
    const { createUser, login, accessToken, refreshCookie } =
      await seedAuthSession(app!);
    expect(createUser.statusCode).toBe(201);
    const createdUser = createUser.json();
    expect(createdUser.email).toBe("admin@example.com");

    expect(login.statusCode).toBe(200);
    expect(accessToken).toEqual(expect.any(String));
    expect(refreshCookie).not.toBe("");

    const refresh = await app!.inject({
      method: "POST",
      url: "/auth/refresh",
      headers: {
        cookie: refreshCookie,
      },
    });

    expect(refresh.statusCode).toBe(200);
    const refreshBody = refresh.json();
    expect(refreshBody.accessToken).toEqual(expect.any(String));

    const me = await app!.inject({
      method: "GET",
      url: "/auth/me",
      headers: {
        authorization: `Bearer ${refreshBody.accessToken as string}`,
      },
    });

    expect(me.statusCode).toBe(200);
    expect(me.json().email).toBe("admin@example.com");

    const refreshedCookie = refresh.headers["set-cookie"] ?? refreshCookie;
    const logout = await app!.inject({
      method: "POST",
      url: "/auth/logout",
      headers: {
        cookie: Array.isArray(refreshedCookie)
          ? refreshedCookie.join("; ")
          : refreshedCookie,
      },
    });

    expect(logout.statusCode).toBe(200);

    const refreshAfterLogout = await app!.inject({
      method: "POST",
      url: "/auth/refresh",
      headers: {
        cookie: Array.isArray(refreshedCookie)
          ? refreshedCookie.join("; ")
          : refreshedCookie,
      },
    });

    expect(refreshAfterLogout.statusCode).toBe(401);
    expect(refreshAfterLogout.json().code).toBe("AUTH_INVALID_REFRESH_TOKEN");
  });
});
