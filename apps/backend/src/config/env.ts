import ms, { type StringValue } from "ms";
import { z } from "zod";

const ALLOWED_NODE_ENVS = ["development", "test", "production"] as const;

function isValidMsDuration(value: string): boolean {
  const durationMs = (ms as (input: string) => number | undefined)(value);
  return typeof durationMs === "number" && durationMs > 0;
}

const tokenExpiresInSchema = (example: string) =>
  z
    .string()
    .trim()
    .min(1, { message: `Token expiry is required (e.g. "${example}").` })
    .refine(isValidMsDuration, {
      message: `Must be a valid duration (e.g. "${example}").`,
    })
    .transform((value) => value as StringValue);

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
  ACCESS_TOKEN_EXPIRES_IN: tokenExpiresInSchema("15m"),
  REFRESH_TOKEN_EXPIRES_IN: tokenExpiresInSchema("7d"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  CORS_ORIGIN: z.url().default("http://localhost:5173"),
  COOKIE_DOMAIN: z.string().trim().min(1).optional(),
  RATE_LIMIT_WINDOW: tokenExpiresInSchema("15m"),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(100),
  AUTH_RATE_LIMIT_WINDOW: tokenExpiresInSchema("15m"),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(5),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:");
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
  ACCESS_TOKEN_TTL_MS: ms(parsedEnv.data.ACCESS_TOKEN_EXPIRES_IN),
  REFRESH_TOKEN_TTL_MS: ms(parsedEnv.data.REFRESH_TOKEN_EXPIRES_IN),
  RATE_LIMIT_WINDOW_MS: ms(parsedEnv.data.RATE_LIMIT_WINDOW),
  AUTH_RATE_LIMIT_WINDOW_MS: ms(parsedEnv.data.AUTH_RATE_LIMIT_WINDOW),
} as const;
