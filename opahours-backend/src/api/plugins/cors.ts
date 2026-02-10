import fastifyCors from "@fastify/cors";
import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";

import { env } from "../../config/env.js";

const parseCorsOrigins = (rawOrigin: string): string[] => {
  if (rawOrigin.trim() === "*") {
    return ["*"];
  }

  return rawOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const corsPluginHandler: FastifyPluginAsync = async (app) => {
  const allowedOrigins = parseCorsOrigins(env.CORS_ORIGIN);

  await app.register(fastifyCors, {
    origin: allowedOrigins.includes("*") ? true : allowedOrigins,
    credentials: true,
  });
};

export const corsPlugin = fastifyPlugin(corsPluginHandler, {
  name: "cors-plugin",
});
