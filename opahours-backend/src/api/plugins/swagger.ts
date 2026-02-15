import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";

const swaggerPluginHandler: FastifyPluginAsync = async (app) => {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "OpaHours API",
        description: "API para controle de horas e faturamento por invoice.",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3333",
          description: "Local development",
        },
      ],
      tags: [
        { name: "System", description: "System and diagnostics endpoints" },
        { name: "Auth", description: "Authentication and session endpoints" },
        { name: "Users", description: "Single-user account management endpoints" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
          refreshTokenCookie: {
            type: "apiKey",
            in: "cookie",
            name: "refreshToken",
          },
        },
      },
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });
};

export const swaggerPlugin = fastifyPlugin(swaggerPluginHandler, {
  name: "swagger-plugin",
});
