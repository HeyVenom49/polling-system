import { ConflictError } from "../../errors/conflict.error";
import {
  AuthRepository,
  authRepository,
  type RegisteredUser,
} from "./auth.repository";
import type { RegisterInput } from "./auth.schema";
import bcrypt from "bcrypt";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export class AuthService {
  constructor(private readonly repository: AuthRepository = authRepository) {}

  async register(data: RegisterInput): Promise<RegisteredUser> {
    const userExists = await this.repository.findByEmailOrUsername(
      data.email,
      data.username,
    );

    if (userExists) {
      throw new ConflictError("Email or username already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    try {
      return await this.repository.createUser({
        username: data.username,
        email: data.email,
        passwordHash,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("Email or username already exists");
      }
      throw error;
    }
  }
}

export const authService = new AuthService();
