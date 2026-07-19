import { ConflictError } from "../../errors/conflict.error";
import { NotFoundError } from "../../errors/not-found.error";
import type { PollRepository } from "../polls/poll.repository";
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

function isForeignKeyViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23503"
  );
}

export class QuestionService {
  constructor(
    private readonly repository: QuestionRepository,
    private readonly pollRepository: PollRepository,
  ) {}

  private async assertPollOwnedBy(
    pollId: string,
    creatorId: string,
  ): Promise<void> {
    const poll = await this.pollRepository.findById(pollId);

    if (!poll || poll.creatorId !== creatorId) {
      throw new NotFoundError("Poll not found");
    }
  }

  async createQuestion(
    pollId: string,
    creatorId: string,
    input: CreateQuestionInput,
  ): Promise<PublicQuestion> {
    await this.assertPollOwnedBy(pollId, creatorId);

    try {
      return await this.repository.createQuestion({ ...input, pollId });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError(
          "A question with this display order already exists for this poll",
        );
      }
      if (isForeignKeyViolation(error)) {
        throw new NotFoundError("Poll not found");
      }
      throw error;
    }
  }

  async getById(id: string, pollId: string): Promise<PublicQuestion> {
    const question = await this.repository.findById(id, pollId);

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    return question;
  }

  async listByPollId(pollId: string): Promise<PublicQuestion[]> {
    return this.repository.findByPollId(pollId);
  }

  async updateQuestion(
    id: string,
    pollId: string,
    creatorId: string,
    data: UpdateQuestionInput,
  ): Promise<PublicQuestion> {
    await this.assertPollOwnedBy(pollId, creatorId);

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

  async deleteQuestion(
    id: string,
    pollId: string,
    creatorId: string,
  ): Promise<void> {
    await this.assertPollOwnedBy(pollId, creatorId);

    const deleted = await this.repository.deleteQuestion(id, pollId);

    if (!deleted) {
      throw new NotFoundError("Question not found");
    }
  }
}
