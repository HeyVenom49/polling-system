import { env } from "../../config/env";
import type { Cache } from "../../infrastructure/cache/cache";

const ATTEMPT_PREFIX = "auth:login-attempts:";
const LOCK_PREFIX = "auth:login-lock:";

function attemptKey(identifier: string): string {
  return `${ATTEMPT_PREFIX}${identifier}`;
}

function lockKey(identifier: string): string {
  return `${LOCK_PREFIX}${identifier}`;
}

export class AuthLockoutRepository {
  constructor(private readonly cache: Cache) {}

  async isLocked(identifier: string): Promise<boolean> {
    const value = await this.cache.get(lockKey(identifier));
    return value !== null;
  }

  async recordFailedAttempt(identifier: string): Promise<{
    attempts: number;
    locked: boolean;
  }> {
    const attempts = await this.cache.increment(
      attemptKey(identifier),
      Math.ceil(env.LOGIN_ATTEMPT_WINDOW_MS / 1_000),
    );

    if (attempts >= env.LOGIN_MAX_ATTEMPTS) {
      await this.cache.set(
        lockKey(identifier),
        "1",
        Math.ceil(env.LOGIN_LOCKOUT_DURATION_MS / 1_000),
      );
      await this.cache.delete(attemptKey(identifier));
      return { attempts, locked: true };
    }

    return { attempts, locked: false };
  }

  async clear(identifier: string): Promise<void> {
    await Promise.all([
      this.cache.delete(attemptKey(identifier)),
      this.cache.delete(lockKey(identifier)),
    ]);
  }
}
