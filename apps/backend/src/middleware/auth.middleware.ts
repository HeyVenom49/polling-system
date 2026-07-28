import type { RequestHandler } from "express";
import { JsonWebTokenError } from "jsonwebtoken";
import { UnauthorizedError } from "../errors/unauthorized.error";
import type { AuthRepository } from "../modules/auth/auth.repository";
import type { PublicUser } from "../modules/auth/auth.types";
import { verifyAccessToken } from "../utils/jwt";

async function resolveUserFromAuthorization(
  authRepository: AuthRepository,
  authorization: string | undefined,
  required: boolean,
): Promise<PublicUser | undefined> {
  const token = authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];

  if (!token) {
    if (required) {
      throw new UnauthorizedError("Bearer access token is required");
    }

    return undefined;
  }

  const payload = verifyAccessToken(token);
  const user = await authRepository.findById(payload.sub);

  if (!user) {
    throw new UnauthorizedError("Invalid or expired access token");
  }

  return user;
}

export function createAuthenticate(
  authRepository: AuthRepository,
): RequestHandler {
  return async (req, _res, next) => {
    try {
      req.user = await resolveUserFromAuthorization(
        authRepository,
        req.headers.authorization,
        true,
      );
      next();
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        next(new UnauthorizedError("Invalid or expired access token"));
        return;
      }

      next(error);
    }
  };
}

export function createOptionalAuthenticate(
  authRepository: AuthRepository,
): RequestHandler {
  return async (req, _res, next) => {
    try {
      req.user = await resolveUserFromAuthorization(
        authRepository,
        req.headers.authorization,
        false,
      );
      next();
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        next(new UnauthorizedError("Invalid or expired access token"));
        return;
      }

      next(error);
    }
  };
}
