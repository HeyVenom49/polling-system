import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { env } from "../../config/env";

export type Database = NodePgDatabase;

export type PostgresClient = {
  db: Database;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

export function createPostgresClient(): PostgresClient {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: env.DB_POOL_CONNECTION_TIMEOUT_MS,
  });

  pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL pool error: ", err);
  });

  const db = drizzle(pool);

  return {
    db,
    connect: async () => {
      await pool.query("SELECT 1");
    },
    disconnect: async () => {
      await pool.end();
    },
  };
}
