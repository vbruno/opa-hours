import { afterEach, describe, expect, it } from "vitest";

import { buildServer } from "../../../src/api/server.js";

describe("API bootstrap", () => {
  let app: ReturnType<typeof buildServer> | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it("returns 200 on GET /health", async () => {
    app = buildServer();

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("serves Swagger UI on GET /docs", async () => {
    app = buildServer();

    const response = await app.inject({
      method: "GET",
      url: "/docs",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
  });

  it("returns CORS headers on preflight OPTIONS /health", async () => {
    app = buildServer();

    const response = await app.inject({
      method: "OPTIONS",
      url: "/health",
      headers: {
        origin: "http://localhost:5173",
        "access-control-request-method": "GET",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
  });
});
