import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { buildServer } from "../../src/api/server.js";
import {
  closeTestDatabase,
  resetAuthTables,
  setupTestDatabase,
} from "../helpers/testDatabase.js";

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
    const createUser = await app!.inject({
      method: "POST",
      url: "/users",
      payload: {
        name: "Admin",
        email: "admin@example.com",
        password: "12345678",
      },
    });

    expect(createUser.statusCode).toBe(201);
    const createdUser = createUser.json();
    expect(createdUser.email).toBe("admin@example.com");

    const login = await app!.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@example.com",
        password: "12345678",
      },
    });

    expect(login.statusCode).toBe(200);
    const loginBody = login.json();
    expect(loginBody.accessToken).toEqual(expect.any(String));
    const loginCookie = login.headers["set-cookie"];
    expect(loginCookie).toBeDefined();

    const refresh = await app!.inject({
      method: "POST",
      url: "/auth/refresh",
      headers: {
        cookie: Array.isArray(loginCookie) ? loginCookie.join("; ") : loginCookie!,
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

    const refreshCookie = refresh.headers["set-cookie"] ?? loginCookie;
    const logout = await app!.inject({
      method: "POST",
      url: "/auth/logout",
      headers: {
        cookie: Array.isArray(refreshCookie)
          ? refreshCookie.join("; ")
          : refreshCookie!,
      },
    });

    expect(logout.statusCode).toBe(200);

    const refreshAfterLogout = await app!.inject({
      method: "POST",
      url: "/auth/refresh",
      headers: {
        cookie: Array.isArray(refreshCookie)
          ? refreshCookie.join("; ")
          : refreshCookie!,
      },
    });

    expect(refreshAfterLogout.statusCode).toBe(401);
    expect(refreshAfterLogout.json().code).toBe("AUTH_INVALID_REFRESH_TOKEN");
  });
});
