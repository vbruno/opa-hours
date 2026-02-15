import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";

import { AuthService } from "../../application/auth/services/authService.js";
import { env } from "../../config/env.js";
import { AppError } from "../../application/shared/errors/appError.js";
import { errorMessages } from "../../application/shared/errors/errorMessages.js";

const authService = new AuthService();

const loginBodySchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(72),
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

const authUserSchema = {
  type: "object",
  required: ["id", "name", "email", "isActive", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    email: { type: "string", format: "email" },
    isActive: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const authSuccessSchema = {
  type: "object",
  required: ["user", "accessToken"],
  properties: {
    user: authUserSchema,
    accessToken: { type: "string" },
  },
};

const okSchema = {
  type: "object",
  required: ["ok"],
  properties: {
    ok: { type: "boolean" },
  },
};

const errorSchema = {
  type: "object",
  required: ["code", "message", "details", "requestId"],
  properties: {
    code: { type: "string" },
    message: { type: "string" },
    details: {
      anyOf: [
        { type: "object", additionalProperties: true },
        { type: "null" },
      ],
    },
    requestId: { type: "string" },
  },
};

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/auth/login",
    {
      config: { access: "public" },
      schema: {
        tags: ["Auth"],
        summary: "Login",
        description: "Authenticate user and start session. Returns access token and sets refresh cookie.",
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8, maxLength: 72 },
          },
        },
        response: {
          200: {
            ...authSuccessSchema,
            headers: {
              "Set-Cookie": {
                description: "HttpOnly refresh cookie",
                schema: { type: "string" },
              },
            },
          },
          401: errorSchema,
          403: errorSchema,
          400: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const body = loginBodySchema.parse(request.body);
      const { user, tokens } = await authService.login(body);

      reply.header("Set-Cookie", buildRefreshCookie(tokens.refreshToken));

      return {
        user,
        accessToken: tokens.accessToken,
      };
    },
  );

  app.post(
    "/auth/refresh",
    {
      config: { access: "public" },
      schema: {
        tags: ["Auth"],
        summary: "Refresh session",
        description: "Rotate refresh cookie and issue a new access token.",
        security: [{ refreshTokenCookie: [] }],
        parameters: [
          {
            in: "cookie",
            name: "refreshToken",
            required: true,
            schema: { type: "string" },
            description: "Refresh token cookie set by login.",
          },
        ],
        response: {
          200: {
            ...authSuccessSchema,
            headers: {
              "Set-Cookie": {
                description: "Rotated HttpOnly refresh cookie",
                schema: { type: "string" },
              },
            },
          },
          401: errorSchema,
        },
      },
    },
    async (request, reply) => {
    const refreshToken = getCookieValue(
      request.headers.cookie,
      REFRESH_COOKIE_NAME,
    );

    if (!refreshToken) {
      clearRefreshCookieOnReply(reply);
      throw new AppError(
        "AUTH_MISSING_REFRESH_TOKEN",
        errorMessages.AUTH_MISSING_REFRESH_TOKEN,
        401,
      );
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

  app.post(
    "/auth/logout",
    {
      config: { access: "public" },
      schema: {
        tags: ["Auth"],
        summary: "Logout",
        description: "Revoke refresh token when present and always clear refresh cookie.",
        security: [{ refreshTokenCookie: [] }],
        parameters: [
          {
            in: "cookie",
            name: "refreshToken",
            required: false,
            schema: { type: "string" },
          },
        ],
        response: {
          200: {
            ...okSchema,
            headers: {
              "Set-Cookie": {
                description: "Refresh cookie cleared (Max-Age=0)",
                schema: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
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
    },
  );

  app.get(
    "/auth/me",
    {
      preHandler: [app.authenticate],
      config: { access: "private" },
      schema: {
        tags: ["Auth"],
        summary: "Get current user",
        description: "Return authenticated user profile from access token context.",
        security: [{ bearerAuth: [] }],
        response: {
          200: authUserSchema,
          401: errorSchema,
        },
      },
    },
    async (request) => authService.getUserById(request.user!.sub),
  );
};
