import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { ZodError } from "zod";

import { AppError } from "../../application/shared/errors/appError.js";
import { errorMessages } from "../../application/shared/errors/errorMessages.js";

const toValidationDetails = (error: ZodError) => ({
  issues: error.issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: issue.path.length > 0 ? issue.path.join(".") : null,
  })),
});

const errorHandlerPluginHandler: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        code: error.code,
        message: error.message,
        details: error.details ?? null,
        requestId: request.id,
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: errorMessages.VALIDATION_ERROR,
        details: toValidationDetails(error),
        requestId: request.id,
      });
    }

    return reply.status(500).send({
      code: "INTERNAL_SERVER_ERROR",
      message: errorMessages.INTERNAL_SERVER_ERROR,
      details: null,
      requestId: request.id,
    });
  });
};

export const errorHandlerPlugin = fastifyPlugin(errorHandlerPluginHandler, {
  name: "error-handler-plugin",
});
