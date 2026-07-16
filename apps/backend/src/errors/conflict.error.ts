import { AppError } from "./app.error";

export class ConflictError extends AppError {
  constructor(message = "Resource already exist") {
    super(409, message);
  }
}
