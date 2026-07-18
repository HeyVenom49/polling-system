import type { Redis } from "ioredis";
import type { Cache } from "./cache";

export class RedisCache implements Cache {
  constructor(private readonly client: Redis) {}

  async setIfAbsent(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.client.set(key, value, "EX", ttlSeconds, "NX");
    return result === "OK";
  }

  async consume(key: string): Promise<string | null> {
    return this.client.getdel(key);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}

export function createRedisCache(client: Redis): Cache {
  return new RedisCache(client);
}
