import "dotenv/config";

import { defineConfig } from "drizzle-kit";

const migrationsDatabaseUrl = process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL;

if (!migrationsDatabaseUrl) {
  throw new Error(
    "DATABASE_URL (or DATABASE_URL_MIGRATIONS) is required to run Drizzle commands. Check opahours-backend/.env.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/infrastructure/db/schema/*.ts",
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
