import type { RequestHandler } from "express";
import { ForbiddenError } from "../errors/forbidden.error";
import { UnauthorizedError } from "../errors/unauthorized.error";

export function requireRoles(...roles: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError("Insufficient permissions"));
      return;
    }

    next();
  };
}

export const requireAdmin = requireRoles("admin");
