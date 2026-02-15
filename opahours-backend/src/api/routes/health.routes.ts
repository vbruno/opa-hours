import type { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/health",
    {
      config: { access: "public" },
      schema: {
        tags: ["System"],
        summary: "Health check",
        description: "Simple health endpoint to confirm API availability.",
        response: {
          200: {
            type: "object",
            required: ["status"],
            properties: {
              status: { type: "string" },
            },
          },
        },
      },
    },
    async () => ({
      status: "ok",
    }),
  );
};
