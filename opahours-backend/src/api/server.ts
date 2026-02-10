import Fastify from "fastify";
import { logger } from "../infrastructure/logger/logger.js";

import { healthRoutes } from "./routes/health.routes.js";

export const buildServer = () => {
  const app = Fastify({ loggerInstance: logger });

  app.register(healthRoutes);

  return app;
};
