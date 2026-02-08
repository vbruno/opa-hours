import { buildServer } from "./api/server.js";
import { env } from "./config/env.js";

const server = buildServer();

try {
  await server.listen({ host: env.HOST, port: env.PORT });
  server.log.info(`Server listening on http://${env.HOST}:${env.PORT}`);
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
