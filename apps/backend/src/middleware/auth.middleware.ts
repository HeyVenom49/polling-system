import type { RequestHandler } from "express";
import { JsonWebTokenError } from "jsonwebtoken";
import { UnauthorizedError } from "../errors/unauthorized.error";
import { authRepository } from "../modules/auth/auth.repository";
import { verifyAccessToken } from "../utils/jwt";

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];

    if (!token) {
      throw new UnauthorizedError("Bearer access token is required");
    }

    const payload = verifyAccessToken(token);
    const user = await authRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedError("Invalid or expired access token");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      next(new UnauthorizedError("Invalid or expired access token"));
      return;
    }

    next(error);
  }
};
