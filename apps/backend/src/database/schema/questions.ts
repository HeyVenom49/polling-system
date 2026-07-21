import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { polls } from "./polls";

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    title: text("title").notNull(),
    isMandatory: boolean("is_mandatory").notNull().default(true),
    displayOrder: integer("display_order").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    pollIdIdx: index("idx_questions_poll_id").on(table.pollId),
    pollDisplayOrderUnique: unique("questions_poll_id_display_order_unique").on(
      table.pollId,
      table.displayOrder,
    ),
    displayOrderNonNegative: check(
      "questions_display_order_non_negative",
      sql`${table.displayOrder} >= 0`,
    ),
  }),
);

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
