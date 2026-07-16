import { AppError } from "./app.error";

export class BadRequest extends AppError {
  constructor(message = "Bad Request") {
    super(401, message);
  }
}
