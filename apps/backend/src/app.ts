import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import type { Express, Router } from "express";
import { env } from "./config/env";
import { errorHandler } from "./middleware/index.middleware";

export function createApp(apiRouter: Router): Express {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api", apiRouter);
  app.use(errorHandler);

  return app;
}
