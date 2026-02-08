import Fastify from "fastify";

import { healthRoutes } from "./routes/health.routes.js";

export const buildServer = () => {
  const app = Fastify({ logger: true });

  app.register(healthRoutes);

  return app;
};
