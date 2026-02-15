import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { AppError } from "../../application/shared/errors/appError.js";
import { UserService } from "../../application/users/services/userService.js";

const userService = new UserService();

const createUserBodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  isActive: z.boolean().optional(),
});

const updateUserBodySchema = z
  .object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
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
    throw new AppError(
      "AUTH_FORBIDDEN",
      "You can only manage your own user account",
      403,
    );
  }
};

export const usersRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/users",
    { config: { access: "public" } },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createUserBodySchema.parse(request.body);
      const usersCount = await userService.countUsers();

      if (usersCount > 0) {
        throw new AppError(
          "AUTH_SINGLE_USER_MODE",
          "System supports a single user only",
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
    { preHandler: [app.authenticate], config: { access: "private" } },
    async (request) =>
      userService
        .listUsers()
        .then((users) => users.filter((user) => user.id === request.user!.sub)),
  );

  app.get(
    "/users/:id",
    { preHandler: [app.authenticate], config: { access: "private" } },
    async (request) => {
      const params = idParamsSchema.parse(request.params);
      ensureSelf(request, params.id);

      return userService.getUserById(params.id);
    },
  );

  app.put(
    "/users/:id",
    { preHandler: [app.authenticate], config: { access: "private" } },
    async (request) => {
      const params = idParamsSchema.parse(request.params);
      ensureSelf(request, params.id);
      const body = updateUserBodySchema.parse(request.body);

      return userService.updateUser(params.id, body);
    },
  );

  app.delete(
    "/users/:id",
    { preHandler: [app.authenticate], config: { access: "private" } },
    async (request) => {
      const params = idParamsSchema.parse(request.params);
      ensureSelf(request, params.id);

      await userService.deleteUser(params.id);

      return { ok: true };
    },
  );
};
