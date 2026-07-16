import bcrypt from "bcrypt";
import { env } from "../../config/env";
import { ConflictError } from "../../errors/conflict.error";
import { UnauthorizedError } from "../../errors/unauthorized.error";
import {
  AuthRepository,
  authRepository,
  type RegisteredUser,
} from "./auth.repository";
import type { LoginInput, RegisterInput } from "./auth.schema";

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
    const [existingEmail, existingUsername] = await Promise.all([
      this.repository.findByEmail(data.email),
      this.repository.findByUsername(data.username),
    ]);

    if (existingEmail || existingUsername) {
      throw new ConflictError("Email or username already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

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

  async login(data: LoginInput): Promise<RegisteredUser> {
    const user = data.identifier.includes("@")
      ? await this.repository.findByEmail(data.identifier)
      : await this.repository.findByUsername(data.identifier);

    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

export const authService = new AuthService();
