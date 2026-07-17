import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "../../database/postgres";
import { users, type NewUser } from "../../database/schema/index";
import type { CredentialsUser, PublicUser } from "./auth.types";

type CreateUserInput = Pick<NewUser, "username" | "email" | "passwordHash">;

const publicUserSelect = {
  id: users.id,
  username: users.username,
  email: users.email,
  role: users.role,
  isEmailVerified: users.isEmailVerified,
  createdAt: users.createdAt,
} as const;

export class AuthRepository {
  async existsByEmail(email: string): Promise<boolean> {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user !== undefined;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return user !== undefined;
  }

  async findCredentialsByIdentifier(
    identifier: string,
  ): Promise<CredentialsUser | null> {
    const [user] = await db
      .select({
        ...publicUserSelect,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(
        and(
          or(eq(users.email, identifier), eq(users.username, identifier)),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    return user ?? null;
  }

  async findById(id: string): Promise<PublicUser | null> {
    const [user] = await db
      .select(publicUserSelect)
      .from(users)
      .where(
        and(
          eq(users.id, id),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    return user ?? null;
  }

  async createUser(data: CreateUserInput): Promise<PublicUser> {
    const [user] = await db
      .insert(users)
      .values(data)
      .returning(publicUserSelect);

    if (!user) {
      throw new Error("User creation failed: no row returned");
    }

    return user;
  }
}

export const authRepository = new AuthRepository();
