import type { Response } from "express";

type SuccessOptions<T> = {
  message: string;
  data?: T;
  statusCode?: number;
};

type FailureOptions = {
  message: string;
  errors?: unknown;
  statusCode?: number;
};

export const sendSuccess = <T>(
  res: Response,
  { message, data, statusCode = 200 }: SuccessOptions<T>,
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
  });
};

export const sendFailure = (
  res: Response,
  { message, errors, statusCode = 400 }: FailureOptions,
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors !== undefined ? { errors } : {}),
  });
};
