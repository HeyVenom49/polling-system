import { client } from "../../database/redis";

const REFRESH_SESSION_PREFIX = "auth:refresh:";

function sessionKey(jwtId: string): string {
  return `${REFRESH_SESSION_PREFIX}${jwtId}`;
}

export class AuthSessionRepository {
  async create(
    jwtId: string,
    userId: string,
    ttlSeconds: number,
  ): Promise<void> {
    const result = await client.set(
      sessionKey(jwtId),
      userId,
      "EX",
      ttlSeconds,
      "NX",
    );

    if (result !== "OK") {
      throw new Error("Failed to create refresh session");
    }
  }

  async consume(jwtId: string): Promise<string | null> {
    return client.getdel(sessionKey(jwtId));
  }

  async delete(jwtId: string): Promise<void> {
    await client.del(sessionKey(jwtId));
  }
}

export const authSessionRepository = new AuthSessionRepository();
