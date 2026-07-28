import { index, pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { questions } from "./questions";
import { responses } from "./responses";
import { options } from "./options";

export const answers = pgTable(
  "answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => responses.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => options.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => ({
    responseQuestionUnique: unique("answers_response_id_question_id_unique").on(
      table.responseId,
      table.questionId,
    ),

    responseIdIdx: index("idx_answers_response_id").on(table.responseId),
    questionIdIdx: index("idx_answers_question_id").on(table.questionId),
    optionIdIdx: index("idx_answers_option_id").on(table.optionId),
  }),
);

export type Answer = typeof answers.$inferSelect;
export type NewAnswer = typeof answers.$inferInsert;
