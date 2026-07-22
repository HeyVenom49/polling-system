import {
  index,
  pgEnum,
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["creator", "user", "admin"]);

export const userPlanEnum = pgEnum("user_plan", ["free", "pro"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 50 }).unique().notNull(),
    email: varchar("email").unique().notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: roleEnum("role").notNull().default("user"),
    plan: userPlanEnum("plan").notNull().default("free"),
    isActive: boolean("is_active").notNull().default(true),
    isEmailVerified: boolean("is_email_verified").notNull().default(false),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    activeDeletedIdx: index("idx_users_active_deleted").on(
      table.isActive,
      table.deletedAt,
    ),
  }),
);

export type NewUser = typeof users.$inferInsert;
