import Fastify from "fastify";
import { ZodError } from "zod";
import { AppError } from "../application/shared/errors/appError.js";
import { logger } from "../infrastructure/logger/logger.js";

import { authPlugin } from "./plugins/auth.js";
import { corsPlugin } from "./plugins/cors.js";
import { authRoutes } from "./routes/auth.routes.js";
import { swaggerPlugin } from "./plugins/swagger.js";
import { healthRoutes } from "./routes/health.routes.js";
import { usersRoutes } from "./routes/users.routes.js";

export const buildServer = () => {
  const app = Fastify({ loggerInstance: logger });

  app.register(corsPlugin);
  app.register(swaggerPlugin);
  app.register(authPlugin);
  app.register(healthRoutes);
  app.register(authRoutes);
  app.register(usersRoutes);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        code: error.code,
        message: error.message,
        details: error.details ?? null,
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: error.flatten(),
      });
    }

    return reply.status(500).send({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected internal server error",
      details: null,
    });
  });

  return app;
};
