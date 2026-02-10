import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "../../config/env.js";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (error) => {
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
