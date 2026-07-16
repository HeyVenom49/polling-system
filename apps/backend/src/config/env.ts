// Required for Node.js. Bun loads .env automatically.
import "dotenv/config";
import { z } from "zod";

const ALLOWED_NODE_ENVS = ["development", "test", "production"] as const;

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  NODE_ENV: z.enum(ALLOWED_NODE_ENVS).default("development"),
  DATABASE_URL: z
    .string()
    .trim()
    .min(1, "DATABASE_URL is required.")
    .refine(
      (url) => url.startsWith("postgres://") || url.startsWith("postgresql://"),
      {
        message: "DATABASE_URL must be a valid PostgreSQL connection string.",
      },
    ),
  DB_POOL_MAX: z.coerce.number().int().min(1).default(12),
  DB_POOL_IDLE_TIMEOUT_MS: z.coerce.number().int().min(0).default(60_000),
  DB_POOL_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(0).default(30_000),
  REDIS_URL: z
    .string()
    .trim()
    .min(1, "REDIS_URL is required.")
    .refine((url) => url.startsWith("redis://"), {
      message: "REDIS_URL must start with redis://",
    }),
  JWT_ACCESS_SECRET: z.string().trim().min(32, {
    message: "JWT_ACCESS_SECRET must be at least 32 characters.",
  }),
  JWT_REFRESH_SECRET: z.string().trim().min(32, {
    message: "JWT_REFRESH_SECRET must be at least 32 characters.",
  }),
  ACCESS_TOKEN_EXPIRES_IN: z.string().min(1, {
    message: 'ACCESS_TOKEN_EXPIRES_IN is required (e.g. "15m", "1h").',
  }),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1, {
    message: 'REFRESH_TOKEN_EXPIRES_IN is required (e.g. "7d", "30d").',
  }),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  CORS_ORIGIN: z.url().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:");
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
