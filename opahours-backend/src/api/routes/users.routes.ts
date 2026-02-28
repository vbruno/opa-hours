import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { AppError } from "../../application/shared/errors/appError.js";
import { errorMessages } from "../../application/shared/errors/errorMessages.js";
import { UserService } from "../../application/users/services/userService.js";

const userService = new UserService();

const nameSchema = z.string().trim().min(2).max(120);
const emailSchema = z.string().trim().email().toLowerCase();
const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
const PASSWORD_POLICY_DESCRIPTION =
  "At least 8 chars with uppercase, lowercase, number and special character";
const PASSWORD_POLICY_PATTERN =
  "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$";
const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(
    PASSWORD_POLICY_REGEX,
    "Password must contain uppercase, lowercase, number and special character",
  );
const passwordSwaggerSchema = {
  type: "string",
  minLength: 8,
  maxLength: 72,
  pattern: PASSWORD_POLICY_PATTERN,
  description: PASSWORD_POLICY_DESCRIPTION,
};

const createUserBodySchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  isActive: z.boolean().optional(),
});

const updateUserBodySchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

const ensureSelf = (request: FastifyRequest, targetUserId: string): void => {
  if (!request.user || request.user.sub !== targetUserId) {
    throw new AppError("AUTH_FORBIDDEN", errorMessages.AUTH_FORBIDDEN, 403);
  }
};

const userSchema = {
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

const errorSchema = {
  type: "object",
  required: ["code", "message", "details", "requestId"],
  properties: {
    code: { type: "string" },
    message: { type: "string" },
    details: {
      anyOf: [{ type: "object", additionalProperties: true }, { type: "null" }],
    },
    requestId: { type: "string" },
  },
};

const okSchema = {
  type: "object",
  required: ["ok"],
  properties: {
    ok: { type: "boolean" },
  },
};

export const usersRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/users",
    {
      config: { access: "public" },
      schema: {
        tags: ["Users"],
        summary: "Bootstrap first user",
        description:
          "Create initial user account. Allowed only when no user exists.",
        body: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 120 },
            email: { type: "string", format: "email" },
            password: passwordSwaggerSchema,
            isActive: { type: "boolean", default: true },
          },
        },
        response: {
          201: userSchema,
          400: errorSchema,
          409: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createUserBodySchema.parse(request.body);
      const usersCount = await userService.countUsers();

      if (usersCount > 0) {
        throw new AppError(
          "AUTH_SINGLE_USER_MODE",
          errorMessages.AUTH_SINGLE_USER_MODE,
          409,
        );
      }

      const user = await userService.createUser(body);

      reply.code(201);

      return user;
    },
  );

  app.get(
    "/users",
    {
      preHandler: [app.authenticate],
      config: { access: "private" },
      schema: {
        tags: ["Users"],
        summary: "List users",
        description: "Single-user mode: returns only the authenticated user.",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "array",
            items: userSchema,
          },
          401: errorSchema,
        },
      },
    },
    async (request) => {
      const user = await userService.getUserById(request.user!.sub);

      return [user];
    },
  );

  app.get(
    "/users/:id",
    {
      preHandler: [app.authenticate],
      config: { access: "private" },
      schema: {
        tags: ["Users"],
        summary: "Get user by id",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: userSchema,
          401: errorSchema,
          403: errorSchema,
          404: errorSchema,
        },
      },
    },
    async (request) => {
      const params = idParamsSchema.parse(request.params);
      ensureSelf(request, params.id);

      return userService.getUserById(params.id);
    },
  );

  app.put(
    "/users/:id",
    {
      preHandler: [app.authenticate],
      config: { access: "private" },
      schema: {
        tags: ["Users"],
        summary: "Update user by id",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          minProperties: 1,
          properties: {
            name: { type: "string", minLength: 2, maxLength: 120 },
            email: { type: "string", format: "email" },
            password: passwordSwaggerSchema,
            isActive: { type: "boolean" },
          },
        },
        response: {
          200: userSchema,
          400: errorSchema,
          401: errorSchema,
          403: errorSchema,
          404: errorSchema,
          409: errorSchema,
        },
      },
    },
    async (request) => {
      const params = idParamsSchema.parse(request.params);
      ensureSelf(request, params.id);
      const body = updateUserBodySchema.parse(request.body);

      return userService.updateUser(params.id, body);
    },
  );

  app.delete(
    "/users/:id",
    {
      preHandler: [app.authenticate],
      config: { access: "private" },
      schema: {
        tags: ["Users"],
        summary: "Delete user by id",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: okSchema,
          401: errorSchema,
          403: errorSchema,
          404: errorSchema,
        },
      },
    },
    async (request) => {
      const params = idParamsSchema.parse(request.params);
      ensureSelf(request, params.id);

      await userService.deleteUser(params.id);

      return { ok: true };
    },
  );
};
