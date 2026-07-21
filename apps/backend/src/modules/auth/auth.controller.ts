import type { Request, Response } from "express";

import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "./auth.schema";
import type { AuthService } from "./auth.service";
import {
  clearRefreshTokenCookie,
  readRefreshTokenCookie,
  setRefreshTokenCookie,
} from "./auth.cookie";
import { UnauthorizedError } from "../../errors/unauthorized.error";
import { sendSuccess } from "../../utils/response";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  async register(
    req: Request<Record<string, never>, unknown, RegisterInput>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.register(req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: "User registered successfully. Check your email to verify.",
      data,
    });
  }

  async login(
    req: Request<Record<string, never>, unknown, LoginInput>,
    res: Response,
  ): Promise<Response> {
    const { user, tokens } = await this.service.login(req.body);
    setRefreshTokenCookie(res, tokens.refreshToken);

    return sendSuccess(res, {
      message: "Login successful",
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    });
  }

  async verifyEmail(
    req: Request<Record<string, never>, unknown, VerifyEmailInput>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.verifyEmail(req.body);
    return sendSuccess(res, {
      message: "Email verified successfully",
      data,
    });
  }

  async resendVerification(
    req: Request<Record<string, never>, unknown, ResendVerificationInput>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.resendVerification(req.body);
    return sendSuccess(res, {
      message: data.message,
    });
  }

  async forgotPassword(
    req: Request<Record<string, never>, unknown, ForgotPasswordInput>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.forgotPassword(req.body);
    return sendSuccess(res, {
      message: data.message,
    });
  }

  async resetPassword(
    req: Request<Record<string, never>, unknown, ResetPasswordInput>,
    res: Response,
  ): Promise<Response> {
    await this.service.resetPassword(req.body);
    return sendSuccess(res, {
      message: "Password reset successfully",
    });
  }

  async changePassword(
    req: Request<Record<string, never>, unknown, ChangePasswordInput>,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    await this.service.changePassword(req.user.id, req.body);
    return sendSuccess(res, {
      message: "Password changed successfully",
    });
  }

  async refresh(req: Request, res: Response): Promise<Response> {
    const refreshToken = readRefreshTokenCookie(req);

    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token is required");
    }

    const { user, tokens } = await this.service.refresh(refreshToken);
    setRefreshTokenCookie(res, tokens.refreshToken);

    return sendSuccess(res, {
      message: "Token refreshed successfully",
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    });
  }

  async logout(req: Request, res: Response): Promise<Response> {
    const refreshToken = readRefreshTokenCookie(req);

    try {
      await this.service.logout(refreshToken);
    } finally {
      clearRefreshTokenCookie(res);
    }

    return sendSuccess(res, {
      message: "Logout successful",
    });
  }

  async me(req: Request, res: Response): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    return sendSuccess(res, {
      message: "Current user fetched successfully",
      data: req.user,
    });
  }
}
