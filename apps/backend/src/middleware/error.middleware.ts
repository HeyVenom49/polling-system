import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app.error";
import { ValidationError } from "../errors/validation.error";
import { env } from "../config/env";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "production" ? "Internal server error" : String(err),
  });
};
