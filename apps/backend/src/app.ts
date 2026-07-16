import express from "express";
import cors from "cors";
import type { Express } from "express";
import apiRoute from "./routes/index";
import { errorHandler } from "./middleware/error.middleware";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use("/api", apiRoute);
app.use(errorHandler);

export default app;
