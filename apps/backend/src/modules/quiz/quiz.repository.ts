import { and, asc, count, eq, sql } from "drizzle-orm";
import {
  answers,
  options,
  questions,
  responses,
  users,
} from "../../database/schema";
import type { Database } from "../../infrastructure/postgres/postgres-client";
import type { QuizLeaderboardEntry } from "./quiz.types";

export class QuizRepository {
  constructor(private readonly db: Database) {}

  async getLeaderboard(pollId: string): Promise<QuizLeaderboardEntry[]> {
    const rows = await this.db
      .select({
        userId: users.id,
        username: users.username,
        correctCount: sql<number>`cast(count(*) filter (where ${options.isCorrect} = true) as int)`,
        answeredCount: count(answers.id),
      })
      .from(responses)
      .innerJoin(users, eq(responses.userId, users.id))
      .innerJoin(answers, eq(answers.responseId, responses.id))
      .innerJoin(options, eq(answers.optionId, options.id))
      .where(eq(responses.pollId, pollId))
      .groupBy(users.id, users.username)
      .orderBy(
        sql`count(*) filter (where ${options.isCorrect} = true) desc`,
        asc(users.username),
      );

    return rows.map((row) => ({
      userId: row.userId,
      username: row.username,
      correctCount: Number(row.correctCount ?? 0),
      answeredCount: Number(row.answeredCount ?? 0),
    }));
  }

  async countAnswersForQuestion(pollId: string, questionId: string) {
    const [row] = await this.db
      .select({ value: count() })
      .from(answers)
      .innerJoin(responses, eq(answers.responseId, responses.id))
      .where(
        and(eq(responses.pollId, pollId), eq(answers.questionId, questionId)),
      );

    return Number(row?.value ?? 0);
  }

  async countCorrectForQuestion(pollId: string, questionId: string) {
    const [row] = await this.db
      .select({ value: count() })
      .from(answers)
      .innerJoin(responses, eq(answers.responseId, responses.id))
      .innerJoin(options, eq(answers.optionId, options.id))
      .where(
        and(
          eq(responses.pollId, pollId),
          eq(answers.questionId, questionId),
          eq(options.isCorrect, true),
        ),
      );

    return Number(row?.value ?? 0);
  }

  async listQuestionIdsByPoll(pollId: string): Promise<string[]> {
    const rows = await this.db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.pollId, pollId))
      .orderBy(asc(questions.displayOrder));
    return rows.map((row) => row.id);
  }
}
