import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app.error";
import { ValidationError } from "../errors/validation.error";
import { env } from "../config/env";
import { sendFailure } from "../utils/response";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ValidationError) {
    sendFailure(res, {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof AppError) {
    sendFailure(res, {
      statusCode: err.statusCode,
      message: err.message,
    });
    return;
  }

  console.error("Unhandled error:", err);

  sendFailure(res, {
    statusCode: 500,
    message:
      env.NODE_ENV === "production" ? "Internal server error" : String(err),
  });
};
