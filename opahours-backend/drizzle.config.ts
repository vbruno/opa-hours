import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "drizzle-kit";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFilePath);

loadDotenv({ path: resolve(currentDir, ".env") });

const migrationsDatabaseUrl =
  process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL;

if (!migrationsDatabaseUrl) {
  throw new Error(
    "DATABASE_URL (or DATABASE_URL_MIGRATIONS) is required to run Drizzle commands. Check opahours-backend/.env.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./dist/infrastructure/db/schema/*.js",
  out: "./src/infrastructure/db/migrations",
  migrations: {
    schema: "public",
    table: "__drizzle_migrations",
  },
  dbCredentials: {
    url: migrationsDatabaseUrl,
  },
  strict: true,
  verbose: true,
});
