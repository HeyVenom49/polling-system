import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { questions } from "./questions";

export const options = pgTable(
  "options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    value: varchar("value", { length: 255 }).notNull(),
    displayOrder: integer("display_order").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    questionIdIdx: index("idx_options_question_id").on(table.questionId),
    questionDisplayOrderUnique: unique(
      "options_question_id_display_order_unique",
    ).on(table.questionId, table.displayOrder),
    questionValueUnique: unique("options_question_id_value_unique").on(
      table.questionId,
      table.value,
    ),
    displayOrderNonNegative: check(
      "options_display_order_non_negative",
      sql`${table.displayOrder} >= 0`,
    ),
    valueNotBlank: check(
      "options_value_not_blank",
      sql`length(trim(${table.value})) > 0`,
    ),
  }),
);

export type Option = typeof options.$inferSelect;
export type NewOption = typeof options.$inferInsert;
