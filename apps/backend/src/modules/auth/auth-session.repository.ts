import type { Cache } from "../../infrastructure/cache/cache";

const REFRESH_SESSION_PREFIX = "auth:refresh:";

function sessionKey(jwtId: string): string {
  return `${REFRESH_SESSION_PREFIX}${jwtId}`;
}

export class AuthSessionRepository {
  constructor(private readonly cache: Cache) {}

  async create(
    jwtId: string,
    userId: string,
    ttlSeconds: number,
  ): Promise<void> {
    const created = await this.cache.setIfAbsent(
      sessionKey(jwtId),
      userId,
      ttlSeconds,
    );

    if (!created) {
      throw new Error("Failed to create refresh session");
    }
  }

  async consume(jwtId: string): Promise<string | null> {
    return this.cache.consume(sessionKey(jwtId));
  }

  async delete(jwtId: string): Promise<void> {
    await this.cache.delete(sessionKey(jwtId));
  }
}
