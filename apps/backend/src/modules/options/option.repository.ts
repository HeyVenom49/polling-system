import { and, asc, eq, ne } from "drizzle-orm";
import { options, questions } from "../../database/schema";
import type { Database } from "../../infrastructure/postgres/postgres-client";
import type {
  CreateOptionData,
  PublicOption,
  UpdateOptionData,
} from "./option.types";

const publicOptionSelect = {
  id: options.id,
  questionId: options.questionId,
  value: options.value,
  displayOrder: options.displayOrder,
  isCorrect: options.isCorrect,
  createdAt: options.createdAt,
  updatedAt: options.updatedAt,
} as const;

export class OptionRepository {
  constructor(private readonly db: Database) {}

  async createOption(data: CreateOptionData): Promise<PublicOption> {
    const [option] = await this.db
      .insert(options)
      .values(data)
      .returning(publicOptionSelect);

    if (!option) {
      throw new Error("Option creation failed: no row returned");
    }

    return option;
  }

  async findById(id: string, questionId: string): Promise<PublicOption | null> {
    const [option] = await this.db
      .select(publicOptionSelect)
      .from(options)
      .where(and(eq(options.id, id), eq(options.questionId, questionId)))
      .limit(1);

    return option ?? null;
  }

  async findByQuestionId(questionId: string): Promise<PublicOption[]> {
    return this.db
      .select(publicOptionSelect)
      .from(options)
      .where(eq(options.questionId, questionId))
      .orderBy(asc(options.displayOrder));
  }

  async findByPollId(pollId: string): Promise<PublicOption[]> {
    return this.db
      .select(publicOptionSelect)
      .from(options)
      .innerJoin(questions, eq(options.questionId, questions.id))
      .where(eq(questions.pollId, pollId))
      .orderBy(asc(questions.displayOrder), asc(options.displayOrder));
  }

  async updateOption(
    id: string,
    questionId: string,
    data: UpdateOptionData,
  ): Promise<PublicOption | null> {
    const [option] = await this.db
      .update(options)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(options.id, id), eq(options.questionId, questionId)))
      .returning(publicOptionSelect);
    return option ?? null;
  }

  async deleteOption(id: string, questionId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(options)
      .where(and(eq(options.id, id), eq(options.questionId, questionId)))
      .returning({ id: options.id });
    return deleted.length > 0;
  }

  async clearCorrectForQuestion(
    questionId: string,
    exceptOptionId?: string,
  ): Promise<void> {
    const where =
      exceptOptionId === undefined
        ? eq(options.questionId, questionId)
        : and(
            eq(options.questionId, questionId),
            ne(options.id, exceptOptionId),
          );

    await this.db
      .update(options)
      .set({ isCorrect: false, updatedAt: new Date() })
      .where(where);
  }
}
