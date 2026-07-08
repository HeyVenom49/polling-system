import express from "express";
import cors from "cors";
import type { Express } from "express";

const app: Express = express();

app.use(cors());
app.use(express.json());

export default app;
