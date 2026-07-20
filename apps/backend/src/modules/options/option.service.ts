import { ConflictError } from "../../errors/conflict.error";
import { NotFoundError } from "../../errors/not-found.error";
import type { PollRepository } from "../polls/poll.repository";
import type { QuestionRepository } from "../questions/question.repository";
import type { OptionRepository } from "./option.repository";
import type { CreateOptionInput, UpdateOptionInput } from "./option.schema";
import type { PublicOption } from "./option.types";

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

function getUniqueViolationMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "constraint" in error &&
    error.constraint === "options_question_id_value_unique"
  ) {
    return "An option with this value already exists for this question";
  }
  return "An option with this display order already exists for this question";
}

export class OptionService {
  constructor(
    private readonly repository: OptionRepository,
    private readonly questionRepository: QuestionRepository,
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

  private async assertQuestionInPoll(
    questionId: string,
    pollId: string,
  ): Promise<void> {
    const question = await this.questionRepository.findById(questionId, pollId);

    if (!question) {
      throw new NotFoundError("Question is found");
    }
  }

  async createOption(
    pollId: string,
    questionId: string,
    creatorId: string,
    input: CreateOptionInput,
  ): Promise<PublicOption> {
    await this.assertPollOwnedBy(pollId, creatorId);
    await this.assertQuestionInPoll(questionId, pollId);

    try {
      return await this.repository.createOption({ ...input, questionId });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError(getUniqueViolationMessage(error));
      }
      if (isForeignKeyViolation(error)) {
        throw new NotFoundError("Question not found");
      }
      throw error;
    }
  }

  async getById(
    id: string,
    pollId: string,
    questionId: string,
  ): Promise<PublicOption> {
    await this.assertQuestionInPoll(questionId, pollId);

    const option = await this.repository.findById(id, questionId);

    if (!option) {
      throw new NotFoundError("Option not found");
    }
    return option;
  }

  async listByQuestionId(
    pollId: string,
    questionId: string,
  ): Promise<PublicOption[]> {
    await this.assertQuestionInPoll(questionId, pollId);

    return this.repository.findByQuestionId(questionId);
  }

  async updateOption(
    id: string,
    pollId: string,
    questionId: string,
    creatorId: string,
    data: UpdateOptionInput,
  ): Promise<PublicOption> {
    await this.assertPollOwnedBy(pollId, creatorId);
    await this.assertQuestionInPoll(questionId, pollId);

    try {
      const option = await this.repository.updateOption(id, questionId, data);
      if (!option) {
        throw new NotFoundError("Option not found");
      }

      return option;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if (isUniqueViolation(error)) {
        throw new ConflictError(getUniqueViolationMessage(error));
      }
      throw error;
    }
  }

  async deleteOption(
    id: string,
    pollId: string,
    questionId: string,
    creatorId: string,
  ): Promise<void> {
    await this.assertPollOwnedBy(pollId, creatorId);
    await this.assertQuestionInPoll(questionId, pollId);

    const deleted = await this.repository.deleteOption(id, questionId);

    if (!deleted) {
      throw new NotFoundError("Option not found");
    }
  }
}
