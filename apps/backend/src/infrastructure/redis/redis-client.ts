import { Redis } from "ioredis";
import { env } from "../../config/env";

export type RedisClient = {
  client: Redis;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

export function createRedisClient(): RedisClient {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    connectTimeout: 10_000,
    lazyConnect: true,
  });

  client.on("error", (err) => {
    console.error("Unexpected Redis client", err);
  });

  return {
    client,
    connect: async () => {
      if (client.status === "ready") return;
      if (client.status === "connecting" || client.status === "connect") {
        await client.ping();
        return;
      }
      await client.connect();
      await client.ping();
    },
    disconnect: async () => {
      if (client.status === "end") return;
      await client.quit();
    },
  };
}
