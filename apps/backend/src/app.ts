import cors from "cors";
import cookieParser from "cookie-parser";
import express, { type RequestHandler } from "express";
import type { Express, Router } from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/index.middleware";

export type CreateAppDeps = {
  apiRouter: Router;
  globalRateLimiter: RequestHandler;
};

export function createApp({
  apiRouter,
  globalRateLimiter,
}: CreateAppDeps): Express {
  const app = express();

  app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "10kb" }));
  app.use("/api", globalRateLimiter, apiRouter);
  app.use(errorHandler);

  return app;
}
