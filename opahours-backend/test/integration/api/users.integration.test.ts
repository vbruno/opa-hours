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
import { bootstrapUser, loginUser, seedAuthSession } from "../../helpers/auth.js";

describe.sequential("Users integration (test DB)", () => {
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

  it("blocks second user bootstrap in single-user mode", async () => {
    const first = await bootstrapUser(app!);
    expect(first.statusCode).toBe(201);

    const second = await bootstrapUser(app!, {
      name: "Second",
      email: "second@example.com",
      password: "Second@123",
    });

    expect(second.statusCode).toBe(409);
    expect(second.json().code).toBe("AUTH_SINGLE_USER_MODE");
  });

  it("returns VALIDATION_ERROR for weak password on user bootstrap", async () => {
    const response = await bootstrapUser(app!, {
      name: "Admin",
      email: "admin@example.com",
      password: "12345678",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("VALIDATION_ERROR");
  });

  it("returns AUTH_MISSING_ACCESS_TOKEN on GET /users without bearer", async () => {
    const response = await app!.inject({
      method: "GET",
      url: "/users",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe("AUTH_MISSING_ACCESS_TOKEN");
  });

  it("returns only authenticated user on GET /users", async () => {
    const { createUser, login, user, accessToken } = await seedAuthSession(app!);
    expect(createUser.statusCode).toBe(201);
    expect(login.statusCode).toBe(200);

    const response = await app!.inject({
      method: "GET",
      url: "/users",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(user.id);
  });

  it("returns AUTH_FORBIDDEN when accessing other user id", async () => {
    const { createUser, login, accessToken } = await seedAuthSession(app!);
    expect(createUser.statusCode).toBe(201);
    expect(login.statusCode).toBe(200);

    const response = await app!.inject({
      method: "GET",
      url: "/users/9a5c72e7-df5f-4abf-a2f7-59dbf346ed5e",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("AUTH_FORBIDDEN");
  });

  it("updates user and returns new values", async () => {
    const { createUser, login, user, accessToken } = await seedAuthSession(app!);
    expect(createUser.statusCode).toBe(201);
    expect(login.statusCode).toBe(200);

    const response = await app!.inject({
      method: "PUT",
      url: `/users/${user.id as string}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        name: "Updated Name",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().name).toBe("Updated Name");
  });

  it("returns VALIDATION_ERROR for empty update payload", async () => {
    const { createUser, login, user, accessToken } = await seedAuthSession(app!);
    expect(createUser.statusCode).toBe(201);
    expect(login.statusCode).toBe(200);

    const response = await app!.inject({
      method: "PUT",
      url: `/users/${user.id as string}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("VALIDATION_ERROR");
  });

  it("deletes user and blocks subsequent login", async () => {
    const { createUser, login, user, accessToken } = await seedAuthSession(app!);
    expect(createUser.statusCode).toBe(201);
    expect(login.statusCode).toBe(200);

    const remove = await app!.inject({
      method: "DELETE",
      url: `/users/${user.id as string}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(remove.statusCode).toBe(200);
    expect(remove.json().ok).toBe(true);

    const loginAfterDelete = await loginUser(app!);
    expect(loginAfterDelete.statusCode).toBe(401);
    expect(loginAfterDelete.json().code).toBe("AUTH_INVALID_CREDENTIALS");
  });
});
