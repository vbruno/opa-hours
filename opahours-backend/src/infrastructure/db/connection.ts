import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "../../config/env.js";

const getDatabaseUrl = (): string => {
  if (env.NODE_ENV === "test") {
    return env.DATABASE_URL_TEST!;
  }

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when NODE_ENV is not test.");
  }

  return env.DATABASE_URL;
};

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (error: unknown) => {
  console.error("[db] Unexpected error on idle client", error);
});

export const db = drizzle(pool);

export const checkDatabaseConnection = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query("select 1");
  } finally {
    client.release();
  }
};

export const closeDatabaseConnection = async (): Promise<void> => {
  await pool.end();
};
