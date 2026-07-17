import type { ZodIssue } from "zod";
import { AppError } from "./app.error";

type ValidationErrorDetail = Pick<
  ZodIssue,
  "code" | "message" | "path"
> & {
  expected?: unknown;
  received?: unknown;
};

export class ValidationError extends AppError {
  constructor(
    public readonly errors: ValidationErrorDetail[],
    message = "Validation failed",
  ) {
    super(400, message);
  }
}
