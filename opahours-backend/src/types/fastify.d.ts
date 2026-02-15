import type * as Fastify from "fastify";

declare module "fastify" {
  interface FastifyContextConfig {
    access?: "public" | "private";
  }

  interface FastifyInstance {
    authenticate: (
      request: Fastify.FastifyRequest,
      reply: Fastify.FastifyReply,
    ) => Promise<void>;
  }

  interface FastifyRequest {
    user?: {
      sub: string;
      email: string;
    };
  }
}
