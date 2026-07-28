import type { Redis } from "ioredis";
import type { RequestHandler } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { env } from "../config/env";
import { sendFailure } from "../utils/response";

type RateLimiterOptions = {
  prefix: string;
  windowMs: number;
  max: number;
  message: string;
};

function createRedisRateLimiter(
  redis: Redis,
  { prefix, windowMs, max, message }: RateLimiterOptions,
): RequestHandler {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => env.NODE_ENV === "test",
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? "127.0.0.1"),
    store: new RedisStore({
      prefix,
      sendCommand: (command: string, ...args: string[]) =>
        redis.call(command, ...args) as Promise<RedisReply>,
    }),
    handler: (_req, res) => {
      sendFailure(res, {
        statusCode: 429,
        message,
      });
    },
  });
}

export function createGlobalRateLimiter(redis: Redis): RequestHandler {
  return createRedisRateLimiter(redis, {
    prefix: "rl:global:",
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    message: "Too many requests. Please try again later.",
  });
}

export function createAuthRateLimiter(redis: Redis): RequestHandler {
  return createRedisRateLimiter(redis, {
    prefix: "rl:auth:",
    windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX,
    message: "Too many authentication attempts. Please try again later.",
  });
}
