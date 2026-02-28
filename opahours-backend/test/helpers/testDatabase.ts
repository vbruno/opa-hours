import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import {
  closeDatabaseConnection,
  db,
} from "../../src/infrastructure/db/connection.js";

let setupPromise: Promise<void> | null = null;
let isDatabaseReady = false;

export const setupTestDatabase = async (): Promise<void> => {
  if (isDatabaseReady) {
    return;
  }

  if (!setupPromise) {
    setupPromise = migrate(db, {
      migrationsFolder: "src/infrastructure/db/migrations",
      migrationsSchema: "public",
      migrationsTable: "__drizzle_migrations",
    }).then(() => {
      isDatabaseReady = true;
    });
  }

  await setupPromise;
};

export const resetAuthTables = async (): Promise<void> => {
  await db.execute(
    sql`TRUNCATE TABLE auth_refresh_tokens, auth_users RESTART IDENTITY CASCADE`,
  );
};

export const resetAllTables = async (): Promise<void> => {
  await db.execute(
    sql`TRUNCATE TABLE lancamentos_itens, lancamentos_hora, pessoas, clientes, auth_refresh_tokens, auth_users RESTART IDENTITY CASCADE`,
  );
};

export const closeTestDatabase = async (): Promise<void> => {
  setupPromise = null;
  isDatabaseReady = false;
  await closeDatabaseConnection();
};
