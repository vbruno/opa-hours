import Fastify from "fastify";
import { logger } from "../infrastructure/logger/logger.js";

import { corsPlugin } from "./plugins/cors.js";
import { swaggerPlugin } from "./plugins/swagger.js";
import { healthRoutes } from "./routes/health.routes.js";

export const buildServer = () => {
  const app = Fastify({ loggerInstance: logger });

  app.register(corsPlugin);
  app.register(swaggerPlugin);
  app.register(healthRoutes);

  return app;
};
