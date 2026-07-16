import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export function validate(schema: ZodType): RequestHandler {
  return (req, res, next): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map(({ code, message, path }) => ({
          code,
          message,
          path,
        })),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
