import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import type { Express } from "express";
import { env } from "./config/env";
import apiRoute from "./routes/index";
import { errorHandler } from "./middleware/index.middleware";

const app: Express = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use("/api", apiRoute);
app.use(errorHandler);

export default app;
