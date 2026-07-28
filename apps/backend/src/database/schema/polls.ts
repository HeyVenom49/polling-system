import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const pollStatusEnum = pgEnum("poll_status", ["open", "closed"]);

export const pollModeEnum = pgEnum("poll_mode", ["poll", "quiz"]);

export const quizStatusEnum = pgEnum("quiz_status", [
  "lobby",
  "question_open",
  "question_closed",
  "finished",
]);

export const pollThemeEnum = pgEnum("poll_theme", [
  "ocean",
  "sunset",
  "midnight",
  "paper",
  "berry",
  "meadow",
  "aurora",
  "slate",
  "citrus",
  "noir",
  "bloom",
]);

export const polls = pgTable(
  "polls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    requireAuthentication: boolean("require_authentication")
      .notNull()
      .default(false),
    mode: pollModeEnum("mode").notNull().default("poll"),
    quizStatus: quizStatusEnum("quiz_status"),
    currentQuestionId: uuid("current_question_id"),
    questionEndsAt: timestamp("question_ends_at"),
    questionDurationSec: integer("question_duration_sec").notNull().default(30),
    expireAt: timestamp("expire_at"),
    status: pollStatusEnum("status").notNull().default("open"),
    resultPublished: boolean("result_published").notNull().default(false),
    themeId: pollThemeEnum("theme_id").notNull().default("ocean"),
    shareId: text("share_id").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    creatorIdIdx: index("idx_polls_creator_id").on(table.creatorId),
  }),
);

export type Poll = typeof polls.$inferSelect;
export type NewPoll = typeof polls.$inferInsert;
