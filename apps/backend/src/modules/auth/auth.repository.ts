import { eq, or } from "drizzle-orm";
import { db } from "../../database/postgres";
import { users, type NewUser } from "../../database/schema/index";

type CreateUserInput = Pick<NewUser, "username" | "email" | "passwordHash">;
export type RegisteredUser = Pick<
  typeof users.$inferSelect,
  "id" | "username" | "email" | "role" | "isEmailVerified" | "createdAt"
>;

export class AuthRepository {
  async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<boolean> {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .limit(1);

    return Boolean(user);
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
