import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";

import { AuthService } from "../../application/auth/services/authService.js";
import { AppError } from "../../application/shared/errors/appError.js";

const authService = new AuthService();

const authPluginHandler: FastifyPluginAsync = async (app) => {
  app.decorate("authenticate", async (request, reply) => {
    void reply;

    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new AppError(
        "AUTH_MISSING_ACCESS_TOKEN",
        "Missing bearer access token",
        401,
      );
    }

    const token = authorization.slice("Bearer ".length).trim();
    const payload = authService.verifyAccessToken(token);

    request.user = {
      sub: payload.sub,
      email: payload.email,
    };
  });
};

export const authPlugin = fastifyPlugin(authPluginHandler, {
  name: "auth-plugin",
});
