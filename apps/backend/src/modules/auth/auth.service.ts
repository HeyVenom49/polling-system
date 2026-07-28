import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { JsonWebTokenError } from "jsonwebtoken";
import { env } from "../../config/env";
import { ConflictError } from "../../errors/conflict.error";
import { ForbiddenError } from "../../errors/forbidden.error";
import { UnauthorizedError } from "../../errors/unauthorized.error";
import { ValidationError } from "../../errors/validation.error";
import type { MailService } from "../../infrastructure/mail/mail.service";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  type RefreshTokenPayload,
} from "../../utils/jwt.ts";
import type { PlanUsage } from "@polling-system/shared";
import type { AuthLockoutRepository } from "./auth-lockout.repository";
import type { AuthRepository } from "./auth.repository";
import type { AuthSessionRepository } from "./auth-session.repository";
import type { AuthTokenRepository } from "./auth-token.repository";
import type { PollQuotaRepository } from "../polls/poll-quota.repository";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "./auth.schema";
import type { AuthResult, PublicUser, TokenPair } from "./auth.types";
import { isUniqueViolation } from "../../utils/db-errors";

export type MePayload = PublicUser & PlanUsage;

const DUMMY_PASSWORD_HASH =
  "$2b$12$9YdMfxwTYQtlWoLb2XwXPul4gWRVO6ymcJePFsL/lO7i1sV0lmWI.";

const GENERIC_EMAIL_SENT_MESSAGE =
  "If an account exists for that email, we sent instructions.";

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly sessionRepository: AuthSessionRepository,
    private readonly tokenRepository: AuthTokenRepository,
    private readonly lockoutRepository: AuthLockoutRepository,
    private readonly mailService: MailService,
    private readonly quotaRepository: PollQuotaRepository,
  ) {}

  async getMe(user: PublicUser): Promise<MePayload> {
    const usage = await this.quotaRepository.getUsage(user.id, user.plan);
    return { ...user, ...usage };
  }

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
      const user = await this.repository.createUser({
        username: data.username,
        email: data.email,
        passwordHash,
      });

      await this.sendEmailVerification(user);

      return user;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("Email or username already exists");
      }
      throw error;
    }
  }

  async login(data: LoginInput): Promise<AuthResult> {
    const identifier = data.identifier.trim().toLowerCase();

    if (await this.lockoutRepository.isLocked(identifier)) {
      throw new ForbiddenError(
        "Too many failed login attempts. Try again later.",
      );
    }

    const user = await this.repository.findCredentialsByIdentifier(identifier);
    const isPasswordValid = await bcrypt.compare(
      data.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !isPasswordValid) {
      const { locked } =
        await this.lockoutRepository.recordFailedAttempt(identifier);

      if (locked) {
        throw new ForbiddenError(
          "Too many failed login attempts. Try again later.",
        );
      }

      throw new UnauthorizedError("Invalid credentials");
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenError(
        "Email not verified. Check your inbox or request a new verification email.",
      );
    }

    await this.lockoutRepository.clear(identifier);

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return {
      user: safeUser,
      tokens: await this.issueTokenPair(user.id),
    };
  }

  async verifyEmail(data: VerifyEmailInput): Promise<PublicUser> {
    const userId = await this.tokenRepository.consumeEmailVerificationToken(
      data.token,
    );

    if (!userId) {
      throw new ValidationError([], "Invalid or expired verification token");
    }

    const user = await this.repository.markEmailVerified(userId);

    if (!user) {
      throw new ValidationError([], "Invalid or expired verification token");
    }

    return user;
  }

  async resendVerification(
    data: ResendVerificationInput,
  ): Promise<{ message: string }> {
    const user = await this.repository.findByEmail(data.email);

    if (user && !user.isEmailVerified) {
      await this.sendEmailVerification(user);
    }

    return { message: GENERIC_EMAIL_SENT_MESSAGE };
  }

  async forgotPassword(
    data: ForgotPasswordInput,
  ): Promise<{ message: string }> {
    const user = await this.repository.findByEmail(data.email);

    if (user) {
      const token = randomUUID();
      await this.tokenRepository.createPasswordResetToken(
        user.id,
        token,
        Math.ceil(env.PASSWORD_RESET_TTL_MS / 1_000),
      );
      await this.mailService.sendPasswordReset(user.email, token);
    }

    return { message: GENERIC_EMAIL_SENT_MESSAGE };
  }

  async resetPassword(data: ResetPasswordInput): Promise<void> {
    const userId = await this.tokenRepository.consumePasswordResetToken(
      data.token,
    );

    if (!userId) {
      throw new ValidationError([], "Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);
    const updated = await this.repository.updatePasswordHash(
      userId,
      passwordHash,
    );

    if (!updated) {
      throw new ValidationError([], "Invalid or expired reset token");
    }
  }

  async changePassword(
    userId: string,
    data: ChangePasswordInput,
  ): Promise<void> {
    const user = await this.repository.findCredentialsById(userId);

    if (!user) {
      throw new UnauthorizedError();
    }

    const isCurrentValid = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentValid) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(data.newPassword, env.BCRYPT_ROUNDS);
    const updated = await this.repository.updatePasswordHash(
      userId,
      passwordHash,
    );

    if (!updated) {
      throw new UnauthorizedError();
    }
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

  private async sendEmailVerification(user: PublicUser): Promise<void> {
    const token = randomUUID();
    await this.tokenRepository.createEmailVerificationToken(
      user.id,
      token,
      Math.ceil(env.EMAIL_VERIFY_TTL_MS / 1_000),
    );
    await this.mailService.sendEmailVerification(user.email, token);
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
