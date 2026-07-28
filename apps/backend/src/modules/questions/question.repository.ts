import { and, asc, eq } from "drizzle-orm";
import { questions } from "../../database/schema";
import type { Database } from "../../infrastructure/postgres/postgres-client";
import type {
  CreateQuestionData,
  PublicQuestion,
  UpdateQuestionData,
} from "./question.types";

const publicQuestionSelect = {
  id: questions.id,
  pollId: questions.pollId,
  title: questions.title,
  isMandatory: questions.isMandatory,
  displayOrder: questions.displayOrder,
  createdAt: questions.createdAt,
  updatedAt: questions.updatedAt,
} as const;

export class QuestionRepository {
  constructor(private readonly db: Database) {}

  async createQuestion(data: CreateQuestionData): Promise<PublicQuestion> {
    const [question] = await this.db
      .insert(questions)
      .values(data)
      .returning(publicQuestionSelect);

    if (!question) {
      throw new Error("Question creation failed: no row returned");
    }

    return question;
  }

  async findById(id: string, pollId: string): Promise<PublicQuestion | null> {
    const [question] = await this.db
      .select(publicQuestionSelect)
      .from(questions)
      .where(and(eq(questions.id, id), eq(questions.pollId, pollId)))
      .limit(1);

    return question ?? null;
  }

  async findByPollId(pollId: string): Promise<PublicQuestion[]> {
    return this.db
      .select(publicQuestionSelect)
      .from(questions)
      .where(eq(questions.pollId, pollId))
      .orderBy(asc(questions.displayOrder));
  }

  async updateQuestion(
    id: string,
    pollId: string,
    data: UpdateQuestionData,
  ): Promise<PublicQuestion | null> {
    const [question] = await this.db
      .update(questions)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(questions.id, id), eq(questions.pollId, pollId)))
      .returning(publicQuestionSelect);

    return question ?? null;
  }

  async reorderQuestions(
    pollId: string,
    orderedIds: string[],
  ): Promise<PublicQuestion[]> {
    const TEMP_OFFSET = 1_000_000;

    return this.db.transaction(async (tx) => {
      for (let index = 0; index < orderedIds.length; index += 1) {
        const id = orderedIds[index]!;
        await tx
          .update(questions)
          .set({
            displayOrder: TEMP_OFFSET + index,
            updatedAt: new Date(),
          })
          .where(and(eq(questions.id, id), eq(questions.pollId, pollId)));
      }

      for (let index = 0; index < orderedIds.length; index += 1) {
        const id = orderedIds[index]!;
        await tx
          .update(questions)
          .set({
            displayOrder: index,
            updatedAt: new Date(),
          })
          .where(and(eq(questions.id, id), eq(questions.pollId, pollId)));
      }

      return tx
        .select(publicQuestionSelect)
        .from(questions)
        .where(eq(questions.pollId, pollId))
        .orderBy(asc(questions.displayOrder));
    });
  }

  async deleteQuestion(id: string, pollId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(questions)
      .where(and(eq(questions.id, id), eq(questions.pollId, pollId)))
      .returning({ id: questions.id });

    return deleted.length > 0;
  }
}
