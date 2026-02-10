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
