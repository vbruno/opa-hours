import { randomUUID } from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { eq } from "drizzle-orm";

import { buildServer } from "../../../src/api/server.js";
import { db } from "../../../src/infrastructure/db/connection.js";
import { lancamentosHora } from "../../../src/infrastructure/db/schema/lancamentosHora.js";
import {
  closeTestDatabase,
  resetAllTables,
  setupTestDatabase,
} from "../../helpers/testDatabase.js";
import { seedAuthSession } from "../../helpers/auth.js";
import { seedCliente, seedPessoa } from "../../helpers/domain.js";

describe.sequential("Work Logs integration (test DB)", () => {
  let app: ReturnType<typeof buildServer> | null = null;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await resetAllTables();
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

  it("creates, gets, lists, updates and deletes a work log", async () => {
    const { accessToken } = await seedAuthSession(app!);
    const { id: personId } = await seedPessoa();
    const { id: clientId } = await seedCliente();

    const create = await app!.inject({
      method: "POST",
      url: "/work-logs",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        personId,
        clientId,
        workDate: "2026-02-27",
        notes: "Initial note",
        dailyAdditionalCents: 500,
        items: [
          {
            location: "Client HQ",
            startAt: "2026-02-27T09:00:00.000Z",
            endAt: "2026-02-27T12:00:00.000Z",
            breakMinutes: 30,
            hourlyRateCents: 10000,
            additionalCents: 250,
          },
        ],
      },
    });

    expect(create.statusCode).toBe(201);
    const created = create.json();
    expect(created.personId).toBe(personId);
    expect(created.clientId).toBe(clientId);
    expect(created.totalCents).toBe(25750);

    const getById = await app!.inject({
      method: "GET",
      url: `/work-logs/${created.id as string}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(getById.statusCode).toBe(200);
    expect(getById.json().id).toBe(created.id);

    const list = await app!.inject({
      method: "GET",
      url: `/work-logs?personId=${personId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(list.statusCode).toBe(200);
    expect(list.json()).toHaveLength(1);

    const update = await app!.inject({
      method: "PUT",
      url: `/work-logs/${created.id as string}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        notes: "Updated note",
        dailyAdditionalCents: 1000,
      },
    });

    expect(update.statusCode).toBe(200);
    expect(update.json().notes).toBe("Updated note");
    expect(update.json().dailyAdditionalCents).toBe(1000);

    const remove = await app!.inject({
      method: "DELETE",
      url: `/work-logs/${created.id as string}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(remove.statusCode).toBe(200);
    expect(remove.json().ok).toBe(true);

    const getAfterDelete = await app!.inject({
      method: "GET",
      url: `/work-logs/${created.id as string}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(getAfterDelete.statusCode).toBe(404);
    expect(getAfterDelete.json().code).toBe("WORK_LOG_NOT_FOUND");
  });

  it("returns conflict when creating duplicate work log for person client and date", async () => {
    const { accessToken } = await seedAuthSession(app!);
    const { id: personId } = await seedPessoa();
    const { id: clientId } = await seedCliente();

    const payload = {
      personId,
      clientId,
      workDate: "2026-02-27",
      items: [
        {
          location: "Client HQ",
          startAt: "2026-02-27T09:00:00.000Z",
          endAt: "2026-02-27T10:00:00.000Z",
          breakMinutes: 0,
          hourlyRateCents: 10000,
        },
      ],
    };

    const first = await app!.inject({
      method: "POST",
      url: "/work-logs",
      headers: { authorization: `Bearer ${accessToken}` },
      payload,
    });
    expect(first.statusCode).toBe(201);

    const second = await app!.inject({
      method: "POST",
      url: "/work-logs",
      headers: { authorization: `Bearer ${accessToken}` },
      payload,
    });

    expect(second.statusCode).toBe(409);
    expect(second.json().code).toBe("WORK_LOG_ALREADY_EXISTS");
  });

  it("returns validation error for invalid query", async () => {
    const { accessToken } = await seedAuthSession(app!);

    const response = await app!.inject({
      method: "GET",
      url: "/work-logs?personId=invalid",
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("VALIDATION_ERROR");
  });

  it("blocks delete when work log is invoiced", async () => {
    const { accessToken } = await seedAuthSession(app!);
    const { id: personId } = await seedPessoa();
    const { id: clientId } = await seedCliente();

    const create = await app!.inject({
      method: "POST",
      url: "/work-logs",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        personId,
        clientId,
        workDate: "2026-02-27",
        items: [
          {
            location: "Client HQ",
            startAt: "2026-02-27T09:00:00.000Z",
            endAt: "2026-02-27T10:00:00.000Z",
            breakMinutes: 0,
            hourlyRateCents: 10000,
          },
        ],
      },
    });

    expect(create.statusCode).toBe(201);
    const id = create.json().id as string;

    await db
      .update(lancamentosHora)
      .set({ statusFaturamento: "invoiced" })
      .where(eq(lancamentosHora.id, id));

    const response = await app!.inject({
      method: "DELETE",
      url: `/work-logs/${id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().code).toBe("WORK_LOG_LOCKED");
  });

  it("returns not found for missing work log", async () => {
    const { accessToken } = await seedAuthSession(app!);

    const response = await app!.inject({
      method: "GET",
      url: `/work-logs/${randomUUID()}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().code).toBe("WORK_LOG_NOT_FOUND");
  });
});
