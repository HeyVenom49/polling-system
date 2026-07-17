import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "../errors/validation.error";

export const validateBody = (schema: ZodType): RequestHandler => {
  return (req, _res, next): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
        new ValidationError(
          result.error.issues.map(({ code, message, path }) => ({
            code,
            message,
            path,
          })),
        ),
      );
      return;
    }

    req.body = result.data;
    next();
  };
};
