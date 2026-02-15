import Fastify from "fastify";
import { logger } from "../infrastructure/logger/logger.js";

import { authPlugin } from "./plugins/auth.js";
import { corsPlugin } from "./plugins/cors.js";
import { errorHandlerPlugin } from "./plugins/error-handler.js";
import { authRoutes } from "./routes/auth.routes.js";
import { swaggerPlugin } from "./plugins/swagger.js";
import { healthRoutes } from "./routes/health.routes.js";
import { usersRoutes } from "./routes/users.routes.js";

export const buildServer = () => {
  const app = Fastify({ loggerInstance: logger });

  app.register(corsPlugin);
  app.register(swaggerPlugin);
  app.register(errorHandlerPlugin);
  app.register(authPlugin);
  app.register(healthRoutes);
  app.register(authRoutes);
  app.register(usersRoutes);

  return app;
};
