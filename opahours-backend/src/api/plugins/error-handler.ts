import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { ZodError } from "zod";

import { AppError } from "../../application/shared/errors/appError.js";
import { errorMessages } from "../../application/shared/errors/errorMessages.js";
import {
  getWorkLogDomainErrorStatusCode,
  WorkLogDomainError,
  workLogDomainErrorMessages,
} from "../../domain/work-logs/errors/workLogDomainErrors.js";

const toValidationDetails = (error: ZodError) => ({
  issues: error.issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: issue.path.length > 0 ? issue.path.join(".") : null,
  })),
});

const toAjvValidationDetails = (error: {
  validation?: Array<{
    keyword?: string;
    message?: string;
    instancePath?: string;
    params?: { missingProperty?: string };
  }>;
}) => ({
  issues: (error.validation ?? []).map((issue) => {
    const pathFromInstance = issue.instancePath
      ? issue.instancePath.replace(/^\//, "").replace(/\//g, ".")
      : null;
    const missingPath = issue.params?.missingProperty ?? null;
    const path = pathFromInstance || missingPath;

    return {
      code: issue.keyword ?? "validation",
      message: issue.message ?? "Invalid value",
      path,
    };
  }),
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

    if (error instanceof WorkLogDomainError) {
      return reply.status(getWorkLogDomainErrorStatusCode(error.code)).send({
        code: error.code,
        message: workLogDomainErrorMessages[error.code],
        details: error.details ?? null,
        requestId: request.id,
      });
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "validation" in error
    ) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: errorMessages.VALIDATION_ERROR,
        details: toAjvValidationDetails(error as {
          validation?: Array<{
            keyword?: string;
            message?: string;
            instancePath?: string;
            params?: { missingProperty?: string };
          }>;
        }),
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
