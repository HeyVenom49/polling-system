import { eq } from "drizzle-orm";
import { db } from "../../database/postgres";
import { users, type NewUser } from "../../database/schema/index";

type CreateUserInput = Pick<NewUser, "username" | "email" | "passwordHash">;

export type RegisteredUser = Pick<
  typeof users.$inferSelect,
  "id" | "username" | "email" | "role" | "isEmailVerified" | "createdAt"
>;

export type AuthUser = Pick<
  typeof users.$inferSelect,
  | "id"
  | "username"
  | "email"
  | "passwordHash"
  | "role"
  | "isEmailVerified"
  | "createdAt"
>;

const authUserSelect = {
  id: users.id,
  username: users.username,
  email: users.email,
  passwordHash: users.passwordHash,
  role: users.role,
  isEmailVerified: users.isEmailVerified,
  createdAt: users.createdAt,
} as const;

export class AuthRepository {
  async findByEmail(email: string): Promise<AuthUser | null> {
    const [user] = await db
      .select(authUserSelect)
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  async findByUsername(username: string): Promise<AuthUser | null> {
    const [user] = await db
      .select(authUserSelect)
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return user ?? null;
  }

  async createUser(data: CreateUserInput): Promise<RegisteredUser> {
    const [user] = await db
      .insert(users)
      .values({
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        isEmailVerified: users.isEmailVerified,
        createdAt: users.createdAt,
      });

    if (!user) {
      throw new Error("User creation failed: no row returned");
    }

    return user;
  }
}

export const authRepository = new AuthRepository();
