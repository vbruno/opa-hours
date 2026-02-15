import type { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", { config: { access: "public" } }, async () => ({
    status: "ok",
  }));
};
