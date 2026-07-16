import type { ZodIssue } from "zod";
import { AppError } from "./app.error";

export class ValidationError extends AppError {
  constructor(
    public readonly errors: Pick<ZodIssue, "code" | "message" | "path">[],
    message = "Validation failed",
  ) {
    super(400, message);
  }
}
