import { createServer, type Server } from "http";
import type { Express } from "express";

export function createHttpServer(app: Express): Server {
  return createServer(app);
}
