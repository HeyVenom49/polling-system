import { env } from "../config/env";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.DB_POOL_CONNECTION_TIMEOUT_MS,
});

pool.on("error", (err) => {
  console.log("Unexpected PostgreSQL pool error: ", err);
});

export const db = drizzle(pool);

export async function connectDatabase() {
  await pool.query("SELECT 1");
}

export async function disconnectDatabase() {
  await pool.end();
}
