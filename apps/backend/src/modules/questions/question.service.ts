import { ConflictError } from "../../errors/conflict.error";
import { NotFoundError } from "../../errors/not-found.error";
import type { QuestionRepository } from "./question.repository";
import type {
  CreateQuestionInput,
  UpdateQuestionInput,
} from "./question.schema";
import type { PublicQuestion } from "./question.types";

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export class QuestionService {
  constructor(private readonly repository: QuestionRepository) {}

  async createQuestion(
    pollId: string,
    input: CreateQuestionInput,
  ): Promise<PublicQuestion> {
    try {
      return await this.repository.createQuestion({ ...input, pollId });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError(
          "A question with this display order already exists for this poll",
        );
      }
      throw error;
    }
  }

  async getById(id: string): Promise<PublicQuestion> {
    const question = await this.repository.findById(id);

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    return question;
  }

  async listByPollId(pollId: string): Promise<PublicQuestion[]> {
    return await this.repository.findByPollId(pollId);
  }

  async updateQuestion(
    id: string,
    pollId: string,
    data: UpdateQuestionInput,
  ): Promise<PublicQuestion> {
    try {
      const question = await this.repository.updateQuestion(id, pollId, data);

      if (!question) {
        throw new NotFoundError("Question not found");
      }

      return question;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if (isUniqueViolation(error)) {
        throw new ConflictError(
          "A question with this display order already exists for this poll",
        );
      }
      throw error;
    }
  }

  async deleteQuestion(id: string, pollId: string): Promise<void> {
    const deleted = await this.repository.deleteQuestion(id, pollId);

    if (!deleted) {
      throw new NotFoundError("Question not found");
    }
  }
}
