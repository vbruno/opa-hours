import type { FastifyInstance } from "fastify";

type TestApp = {
  inject: FastifyInstance["inject"];
};

type BootstrapUserPayload = {
  name?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
};

type LoginPayload = {
  email?: string;
  password?: string;
};

export const toCookieHeader = (setCookie: string | string[] | undefined): string => {
  if (!setCookie) {
    return "";
  }

  return Array.isArray(setCookie) ? setCookie.join("; ") : setCookie;
};

export const bootstrapUser = async (
  app: TestApp,
  payload?: BootstrapUserPayload,
) => {
  return app.inject({
    method: "POST",
    url: "/users",
    payload: {
      name: payload?.name ?? "Admin",
      email: payload?.email ?? "admin@example.com",
      password: payload?.password ?? "Admin@123",
      ...(payload?.isActive !== undefined ? { isActive: payload.isActive } : {}),
    },
  });
};

export const loginUser = async (
  app: TestApp,
  payload?: LoginPayload,
) => {
  return app.inject({
    method: "POST",
    url: "/auth/login",
    payload: {
      email: payload?.email ?? "admin@example.com",
      password: payload?.password ?? "Admin@123",
    },
  });
};

export const seedAuthSession = async (
  app: TestApp,
  payload?: BootstrapUserPayload,
) => {
  const createUser = await bootstrapUser(app, payload);
  const user = createUser.statusCode === 201 ? createUser.json() : null;

  const login = await loginUser(app, {
    email: payload?.email,
    password: payload?.password,
  });
  const loginBody =
    login.statusCode === 200 ? (login.json() as { accessToken: string }) : null;

  return {
    createUser,
    login,
    user,
    accessToken: loginBody?.accessToken ?? null,
    refreshCookie: toCookieHeader(login.headers["set-cookie"]),
  };
};
