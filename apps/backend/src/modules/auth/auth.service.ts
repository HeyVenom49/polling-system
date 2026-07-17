import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { JsonWebTokenError } from "jsonwebtoken";
import { env } from "../../config/env";
import { ConflictError } from "../../errors/conflict.error";
import { UnauthorizedError } from "../../errors/unauthorized.error";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  type RefreshTokenPayload,
} from "../../utils/jwt.ts";
import { AuthRepository, authRepository } from "./auth.repository";
import {
  AuthSessionRepository,
  authSessionRepository,
} from "./auth-session.repository";
import type { LoginInput, RegisterInput } from "./auth.schema";
import type { AuthResult, PublicUser, TokenPair } from "./auth.types";

const DUMMY_PASSWORD_HASH =
  "$2b$12$9YdMfxwTYQtlWoLb2XwXPul4gWRVO6ymcJePFsL/lO7i1sV0lmWI.";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository = authRepository,
    private readonly sessionRepository: AuthSessionRepository = authSessionRepository,
  ) {}

  async register(data: RegisterInput): Promise<PublicUser> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.repository.existsByEmail(data.email),
      this.repository.existsByUsername(data.username),
    ]);

    if (existingEmail || existingUsername) {
      throw new ConflictError("Email or username already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    try {
      return await this.repository.createUser({
        username: data.username,
        email: data.email,
        passwordHash,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("Email or username already exists");
      }
      throw error;
    }
  }

  async login(data: LoginInput): Promise<AuthResult> {
    const user = await this.repository.findCredentialsByIdentifier(
      data.identifier,
    );
    const isPasswordValid = await bcrypt.compare(
      data.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return {
      user: safeUser,
      tokens: await this.issueTokenPair(user.id),
    };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const payload = this.parseRefreshToken(refreshToken);
    const sessionUserId = await this.sessionRepository.consume(payload.jti);

    if (sessionUserId !== payload.sub) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const user = await this.repository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    return {
      user,
      tokens: await this.issueTokenPair(user.id),
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = verifyRefreshToken(refreshToken);
      await this.sessionRepository.delete(payload.jti);
    } catch (error) {
      if (!(error instanceof JsonWebTokenError)) {
        throw error;
      }
    }
  }

  private async issueTokenPair(userId: string): Promise<TokenPair> {
    const jwtId = randomUUID();
    const tokens = {
      accessToken: generateAccessToken(userId),
      refreshToken: generateRefreshToken(userId, jwtId),
    };

    await this.sessionRepository.create(
      jwtId,
      userId,
      Math.ceil(env.REFRESH_TOKEN_TTL_MS / 1_000),
    );

    return tokens;
  }

  private parseRefreshToken(refreshToken: string): RefreshTokenPayload {
    try {
      return verifyRefreshToken(refreshToken);
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedError("Invalid or expired refresh token");
      }

      throw error;
    }
  }
}

export const authService = new AuthService();
