import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { closeDatabaseConnection, db } from "../../src/infrastructure/db/connection.js";

export const setupTestDatabase = async (): Promise<void> => {
  await migrate(db, {
    migrationsFolder: "src/infrastructure/db/migrations",
    migrationsSchema: "public",
    migrationsTable: "__drizzle_migrations",
  });
};

export const resetAuthTables = async (): Promise<void> => {
  await db.execute(
    sql`TRUNCATE TABLE auth_refresh_tokens, auth_users RESTART IDENTITY CASCADE`,
  );
};

export const closeTestDatabase = async (): Promise<void> => {
  await closeDatabaseConnection();
};
