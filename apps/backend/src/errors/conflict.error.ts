import { AppError } from "./app.error";

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, message);
  }
}
