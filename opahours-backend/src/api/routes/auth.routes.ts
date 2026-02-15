import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";

import { AuthService } from "../../application/auth/services/authService.js";
import { env } from "../../config/env.js";
import { AppError } from "../../application/shared/errors/appError.js";

const authService = new AuthService();

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const REFRESH_COOKIE_NAME = "refreshToken";

const getCookieValue = (cookieHeader: string | undefined, key: string): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const part of parts) {
    const [cookieKey, ...valueParts] = part.split("=");

    if (cookieKey === key) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
};

const buildRefreshCookie = (token: string): string => {
  const maxAge = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;
  const sameSite = env.NODE_ENV === "production" ? "Strict" : "Lax";
  const secure = env.NODE_ENV === "production" ? "; Secure" : "";

  return `${REFRESH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAge}${secure}`;
};

const clearRefreshCookie = (): string => {
  const sameSite = env.NODE_ENV === "production" ? "Strict" : "Lax";
  const secure = env.NODE_ENV === "production" ? "; Secure" : "";

  return `${REFRESH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=0${secure}`;
};

const clearRefreshCookieOnReply = (reply: FastifyReply): void => {
  reply.header("Set-Cookie", clearRefreshCookie());
};

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/login", { config: { access: "public" } }, async (request, reply) => {
    const body = loginBodySchema.parse(request.body);
    const { user, tokens } = await authService.login(body);

    reply.header("Set-Cookie", buildRefreshCookie(tokens.refreshToken));

    return {
      user,
      accessToken: tokens.accessToken,
    };
  });

  app.post(
    "/auth/refresh",
    { config: { access: "public" } },
    async (request, reply) => {
    const refreshToken = getCookieValue(
      request.headers.cookie,
      REFRESH_COOKIE_NAME,
    );

    if (!refreshToken) {
      clearRefreshCookieOnReply(reply);
      throw new AppError("AUTH_MISSING_REFRESH_TOKEN", "Missing refresh token", 401);
    }

    try {
      const { user, tokens } = await authService.refresh({ refreshToken });

      reply.header("Set-Cookie", buildRefreshCookie(tokens.refreshToken));

      return {
        user,
        accessToken: tokens.accessToken,
      };
    } catch (error) {
      clearRefreshCookieOnReply(reply);
      throw error;
    }
    },
  );

  app.post("/auth/logout", { config: { access: "public" } }, async (request, reply) => {
    const refreshToken = getCookieValue(
      request.headers.cookie,
      REFRESH_COOKIE_NAME,
    );

    if (refreshToken) {
      try {
        await authService.logout({ refreshToken });
      } catch {
        // Logout is idempotent: invalid/expired token still clears cookie.
      }
    }

    clearRefreshCookieOnReply(reply);

    return { ok: true };
  });

  app.get(
    "/auth/me",
    { preHandler: [app.authenticate], config: { access: "private" } },
    async (request) => authService.getUserById(request.user!.sub),
  );
};
