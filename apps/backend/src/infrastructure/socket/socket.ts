import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import type { Redis } from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "../../config/env";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./socket.events";

export type SocketData = {
  userId?: string;
  userRole?: string;
};

export type SocketServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export function createSocketServer(httpServer: HttpServer): SocketServer {
  return new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });
}

export function attachSocketRedisAdapter(
  io: SocketServer,
  pubClient: Redis,
  subClient: Redis,
): void {
  io.adapter(createAdapter(pubClient, subClient));
}
