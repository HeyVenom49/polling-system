import { env } from "../config/env";
import { Redis } from "ioredis";

const client = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  connectTimeout: 10_000,
  lazyConnect: true,
});

client.on("error", (err) => {
  console.error("Unexpected Redis client", err);
});

export async function connectRedis() {
  if (client.status === "ready") return;
  if (client.status === "connecting" || client.status === "connect") {
    await client.ping();
    return;
  }
  try {
    await client.connect();
    await client.ping();
  } catch (error) {
    throw error;
  }
}

export async function disconnectRedis() {
  if (client.status === "end") return;
  await client.quit();
}

export { client };
