import type { Cache } from "../../infrastructure/cache/cache";

const EMAIL_VERIFY_PREFIX = "auth:email-verify:";
const EMAIL_VERIFY_USER_PREFIX = "auth:email-verify-user:";
const PASSWORD_RESET_PREFIX = "auth:password-reset:";
const PASSWORD_RESET_USER_PREFIX = "auth:password-reset-user:";

function emailVerifyKey(token: string): string {
  return `${EMAIL_VERIFY_PREFIX}${token}`;
}

function emailVerifyUserKey(userId: string): string {
  return `${EMAIL_VERIFY_USER_PREFIX}${userId}`;
}

function passwordResetKey(token: string): string {
  return `${PASSWORD_RESET_PREFIX}${token}`;
}

function passwordResetUserKey(userId: string): string {
  return `${PASSWORD_RESET_USER_PREFIX}${userId}`;
}

export class AuthTokenRepository {
  constructor(private readonly cache: Cache) {}

  async createEmailVerificationToken(
    userId: string,
    token: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.replaceUserToken(
      emailVerifyUserKey(userId),
      emailVerifyKey,
      token,
      userId,
      ttlSeconds,
    );
  }

  async consumeEmailVerificationToken(token: string): Promise<string | null> {
    const userId = await this.cache.consume(emailVerifyKey(token));

    if (userId) {
      await this.cache.delete(emailVerifyUserKey(userId));
    }

    return userId;
  }

  async createPasswordResetToken(
    userId: string,
    token: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.replaceUserToken(
      passwordResetUserKey(userId),
      passwordResetKey,
      token,
      userId,
      ttlSeconds,
    );
  }

  async consumePasswordResetToken(token: string): Promise<string | null> {
    const userId = await this.cache.consume(passwordResetKey(token));

    if (userId) {
      await this.cache.delete(passwordResetUserKey(userId));
    }

    return userId;
  }

  private async replaceUserToken(
    userKey: string,
    tokenKey: (token: string) => string,
    token: string,
    userId: string,
    ttlSeconds: number,
  ): Promise<void> {
    const existingToken = await this.cache.get(userKey);

    if (existingToken) {
      await this.cache.delete(tokenKey(existingToken));
    }

    await this.cache.set(tokenKey(token), userId, ttlSeconds);
    await this.cache.set(userKey, token, ttlSeconds);
  }
}
