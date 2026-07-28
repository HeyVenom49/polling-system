import { and, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import type { Database } from "../../infrastructure/postgres/postgres-client";
import { answers, responses } from "../../database/schema";

export class ResultRepository {
  constructor(private readonly db: Database) {}

  async countResponsesByPollId(pollId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(responses)
      .where(eq(responses.pollId, pollId));

    return Number(row?.value ?? 0);
  }

  async countGuestResponsesByPollId(pollId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(responses)
      .where(
        and(eq(responses.pollId, pollId), isNotNull(responses.guestId)),
      );

    return Number(row?.value ?? 0);
  }

  async countAuthenticatedResponsesByPollId(pollId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(responses)
      .where(and(eq(responses.pollId, pollId), isNotNull(responses.userId)));

    return Number(row?.value ?? 0);
  }

  async countAnswersByOptionForPoll(
    pollId: string,
  ): Promise<{ optionId: string; count: number }[]> {
    const rows = await this.db
      .select({
        optionId: answers.optionId,
        count: count(),
      })
      .from(answers)
      .innerJoin(responses, eq(answers.responseId, responses.id))
      .where(eq(responses.pollId, pollId))
      .groupBy(answers.optionId);

    return rows.map((row) => ({
      optionId: row.optionId,
      count: Number(row.count),
    }));
  }

  async countResponsesByDay(
    pollId: string,
  ): Promise<{ date: string; count: number }[]> {
    const day = sql<string>`to_char(date_trunc('day', ${responses.submittedAt}), 'YYYY-MM-DD')`;

    const rows = await this.db
      .select({
        date: day,
        count: count(),
      })
      .from(responses)
      .where(eq(responses.pollId, pollId))
      .groupBy(day)
      .orderBy(day);

    return rows.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));
  }

  async findLatestResponses(
    pollId: string,
    limit: number,
  ): Promise<
    {
      id: string;
      userId: string | null;
      guestId: string | null;
      submittedAt: Date;
    }[]
  > {
    return this.db
      .select({
        id: responses.id,
        userId: responses.userId,
        guestId: responses.guestId,
        submittedAt: responses.submittedAt,
      })
      .from(responses)
      .where(eq(responses.pollId, pollId))
      .orderBy(desc(responses.submittedAt))
      .limit(limit);
  }
}
