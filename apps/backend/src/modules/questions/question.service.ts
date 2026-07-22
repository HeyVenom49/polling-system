import { ConflictError } from "../../errors/conflict.error";
import { NotFoundError } from "../../errors/not-found.error";
import { ValidationError } from "../../errors/validation.error";
import {
  isForeignKeyViolation,
  isUniqueViolation,
} from "../../utils/db-errors";
import { assertPollReadable } from "../polls/poll-access";
import type { PollRepository } from "../polls/poll.repository";
import type { QuestionRepository } from "./question.repository";
import type {
  CreateQuestionInput,
  UpdateQuestionInput,
} from "./question.schema";
import type { PublicQuestion } from "./question.types";

export class QuestionService {
  constructor(
    private readonly repository: QuestionRepository,
    private readonly pollRepository: PollRepository,
  ) {}

  private async assertPollOwnedBy(
    pollId: string,
    actorId: string,
    actorRole?: string,
  ): Promise<void> {
    const poll = await this.pollRepository.findById(pollId);

    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    if (poll.creatorId !== actorId && actorRole !== "admin") {
      throw new NotFoundError("Poll not found");
    }
  }

  private async assertPollReadableForViewer(
    pollId: string,
    viewerId?: string,
    viewerRole?: string,
  ): Promise<void> {
    const poll = await this.pollRepository.findById(pollId);

    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    assertPollReadable(poll, viewerId, viewerRole);
  }

  async createQuestion(
    pollId: string,
    actorId: string,
    input: CreateQuestionInput,
    actorRole?: string,
  ): Promise<PublicQuestion> {
    await this.assertPollOwnedBy(pollId, actorId, actorRole);

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

  async getById(
    id: string,
    pollId: string,
    viewerId?: string,
    viewerRole?: string,
  ): Promise<PublicQuestion> {
    await this.assertPollReadableForViewer(pollId, viewerId, viewerRole);

    const question = await this.repository.findById(id, pollId);

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    return question;
  }

  async listByPollId(
    pollId: string,
    viewerId?: string,
    viewerRole?: string,
  ): Promise<PublicQuestion[]> {
    await this.assertPollReadableForViewer(pollId, viewerId, viewerRole);
    return this.repository.findByPollId(pollId);
  }

  async updateQuestion(
    id: string,
    pollId: string,
    actorId: string,
    data: UpdateQuestionInput,
    actorRole?: string,
  ): Promise<PublicQuestion> {
    await this.assertPollOwnedBy(pollId, actorId, actorRole);

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
    actorId: string,
    actorRole?: string,
  ): Promise<void> {
    await this.assertPollOwnedBy(pollId, actorId, actorRole);

    const deleted = await this.repository.deleteQuestion(id, pollId);

    if (!deleted) {
      throw new NotFoundError("Question not found");
    }
  }

  async reorderQuestions(
    pollId: string,
    actorId: string,
    orderedIds: string[],
    actorRole?: string,
  ): Promise<PublicQuestion[]> {
    await this.assertPollOwnedBy(pollId, actorId, actorRole);

    const existing = await this.repository.findByPollId(pollId);
    const existingIds = new Set(existing.map((question) => question.id));

    if (
      orderedIds.length !== existing.length ||
      orderedIds.some((id) => !existingIds.has(id)) ||
      new Set(orderedIds).size !== orderedIds.length
    ) {
      throw new ValidationError(
        [],
        "orderedIds must include each question id for this poll exactly once",
      );
    }

    return this.repository.reorderQuestions(pollId, orderedIds);
  }
}
