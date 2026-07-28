import { and, eq, ilike, isNull, or, sql } from "drizzle-orm";
import type { Database } from "../../infrastructure/postgres/postgres-client";
import { users, type NewUser } from "../../database/schema/index";
import type { CredentialsUser, PublicUser } from "./auth.types";

type CreateUserInput = Pick<NewUser, "username" | "email" | "passwordHash">;

const publicUserSelect = {
  id: users.id,
  username: users.username,
  email: users.email,
  role: users.role,
  plan: users.plan,
  isEmailVerified: users.isEmailVerified,
  createdAt: users.createdAt,
} as const;

export class AuthRepository {
  constructor(private readonly db: Database) {}

  async existsByEmail(email: string): Promise<boolean> {
    const [user] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user !== undefined;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const [user] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return user !== undefined;
  }

  async findCredentialsByIdentifier(
    identifier: string,
  ): Promise<CredentialsUser | null> {
    const [user] = await this.db
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

  async findCredentialsById(id: string): Promise<CredentialsUser | null> {
    const [user] = await this.db
      .select({
        ...publicUserSelect,
        passwordHash: users.passwordHash,
      })
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

  async findById(id: string): Promise<PublicUser | null> {
    const [user] = await this.db
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

  async findByEmail(email: string): Promise<PublicUser | null> {
    const [user] = await this.db
      .select(publicUserSelect)
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    return user ?? null;
  }

  async createUser(data: CreateUserInput): Promise<PublicUser> {
    const [user] = await this.db
      .insert(users)
      .values(data)
      .returning(publicUserSelect);

    if (!user) {
      throw new Error("User creation failed: no row returned");
    }

    return user;
  }

  async markEmailVerified(userId: string): Promise<PublicUser | null> {
    const [user] = await this.db
      .update(users)
      .set({
        isEmailVerified: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, userId),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .returning(publicUserSelect);

    return user ?? null;
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<boolean> {
    const [user] = await this.db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, userId),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .returning({ id: users.id });

    return user !== undefined;
  }

  async updateRole(
    userId: string,
    role: NewUser["role"],
  ): Promise<PublicUser | null> {
    const [user] = await this.db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, userId),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .returning(publicUserSelect);

    return user ?? null;
  }

  async updatePlan(
    userId: string,
    plan: NewUser["plan"],
  ): Promise<PublicUser | null> {
    const [user] = await this.db
      .update(users)
      .set({
        plan,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, userId),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .returning(publicUserSelect);

    return user ?? null;
  }

  async searchUsers(
    query: string,
    limit = 20,
    offset = 0,
  ): Promise<{ items: PublicUser[]; total: number }> {
    const pattern = `%${query.trim().toLowerCase()}%`;
    const active = and(eq(users.isActive, true), isNull(users.deletedAt));
    const match = or(
      ilike(users.email, pattern),
      ilike(users.username, pattern),
    );

    const where = and(active, match);

    const [countRow] = await this.db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(users)
      .where(where);

    const items = await this.db
      .select(publicUserSelect)
      .from(users)
      .where(where)
      .orderBy(users.username)
      .limit(limit)
      .offset(offset);

    return {
      items,
      total: countRow?.total ?? 0,
    };
  }
}
