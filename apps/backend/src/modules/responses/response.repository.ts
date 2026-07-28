import { and, eq } from "drizzle-orm";
import { answers, responses } from "../../database/schema";
import type { Database } from "../../infrastructure/postgres/postgres-client";
import type {
  CreateAnswerData,
  CreateResponseData,
  PublicAnswer,
  PublicResponse,
} from "./response.types";

const publicResponseSelect = {
  id: responses.id,
  pollId: responses.pollId,
  userId: responses.userId,
  guestId: responses.guestId,
  submittedAt: responses.submittedAt,
} as const;

const publicAnswerSelect = {
  id: answers.id,
  responseId: answers.responseId,
  questionId: answers.questionId,
  optionId: answers.optionId,
} as const;

export class ResponseRepository {
  constructor(private readonly db: Database) {}

  async createResponseWithAnswers(
    data: CreateResponseData,
    items: CreateAnswerData[],
  ): Promise<{ response: PublicResponse; answers: PublicAnswer[] }> {
    return this.db.transaction(async (tx) => {
      const [response] = await tx
        .insert(responses)
        .values(data)
        .returning(publicResponseSelect);

      if (!response) {
        throw new Error("Response creation failed: no row returned");
      }

      const answerRows = await tx
        .insert(answers)
        .values(items.map((item) => ({ ...item, responseId: response.id })))
        .returning(publicAnswerSelect);

      return { response, answers: answerRows };
    });
  }

  async findById(id: string, pollId: string): Promise<PublicResponse | null> {
    const [response] = await this.db
      .select(publicResponseSelect)
      .from(responses)
      .where(and(eq(responses.id, id), eq(responses.pollId, pollId)))
      .limit(1);

    return response ?? null;
  }

  async findByPollAndUser(
    pollId: string,
    userId: string,
  ): Promise<PublicResponse | null> {
    const [response] = await this.db
      .select(publicResponseSelect)
      .from(responses)
      .where(and(eq(responses.pollId, pollId), eq(responses.userId, userId)))
      .limit(1);

    return response ?? null;
  }

  async addAnswer(
    responseId: string,
    item: CreateAnswerData,
  ): Promise<PublicAnswer> {
    const [answer] = await this.db
      .insert(answers)
      .values({ ...item, responseId })
      .returning(publicAnswerSelect);

    if (!answer) {
      throw new Error("Answer creation failed: no row returned");
    }

    return answer;
  }

  async findAnswerForQuestion(
    responseId: string,
    questionId: string,
  ): Promise<PublicAnswer | null> {
    const [answer] = await this.db
      .select(publicAnswerSelect)
      .from(answers)
      .where(
        and(
          eq(answers.responseId, responseId),
          eq(answers.questionId, questionId),
        ),
      )
      .limit(1);

    return answer ?? null;
  }

  async findAnswersByResponseId(responseId: string): Promise<PublicAnswer[]> {
    return this.db
      .select(publicAnswerSelect)
      .from(answers)
      .where(eq(answers.responseId, responseId));
  }

  async deleteByPollId(pollId: string): Promise<number> {
    const deleted = await this.db
      .delete(responses)
      .where(eq(responses.pollId, pollId))
      .returning({ id: responses.id });
    return deleted.length;
  }
}
