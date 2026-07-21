import { count, eq } from "drizzle-orm";
import type { Database } from "../../infrastructure/postgres/postgres-client";
import { answers, responses } from "../../database/schema";

export class ResultRepository {
  constructor(private readonly db: Database) {}

  async countResponsesByPollId(pollId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(responses)
      .where(eq(responses.pollId, pollId));

    return row?.value ?? 0;
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
}
