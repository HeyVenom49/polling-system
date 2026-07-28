import {
  check,
  index,
  pgTable,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { polls } from "./polls";
import { users } from "./users";
import { guests } from "./guests";
import { sql } from "drizzle-orm";

export const responses = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    guestId: uuid("guest_id").references(() => guests.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  },
  (table) => ({
    oneIdentity: check(
      "response_one_identity",
      sql`(
                (${table.userId} IS NOT NULL AND ${table.guestId} IS NULL)
                OR
                (${table.userId} IS NULL AND ${table.guestId} IS NOT NULL)
            )`,
    ),

    pollUserUnique: unique("response_poll_id_user_id_unique").on(
      table.pollId,
      table.userId,
    ),
    pollGuestUnique: unique("response_poll_id_guest_id_unique").on(
      table.pollId,
      table.guestId,
    ),

    pollIdIdx: index("idx_response_poll_id").on(table.pollId),
  }),
);

export type Response = typeof responses.$inferSelect;
export type NewResponse = typeof responses.$inferInsert;
