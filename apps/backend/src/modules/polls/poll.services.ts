import { randomUUID } from "node:crypto";
import type { CreatePollInput } from "./poll.schema";
import type {
  PaginatedPolls,
  PollForm,
  PublicPoll,
  UpdatePollData,
} from "./poll.types";
import type { PollRepository } from "./poll.repository";
import { ConflictError } from "../../errors/conflict.error";
import { NotFoundError } from "../../errors/not-found.error";
import type { PollRealtime } from "../../infrastructure/socket/poll-realtime";
import type { OptionRepository } from "../options/option.repository";
import type { QuestionRepository } from "../questions/question.repository";
import type { ResultService } from "../results/result.service";
import { assertPollReadable } from "./poll-access";

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export class PollService {
  constructor(
    private readonly repository: PollRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly optionRepository: OptionRepository,
    private readonly pollRealtime: PollRealtime,
    private readonly resultService: ResultService,
  ) {}

  async createPoll(
    creatorId: string,
    input: CreatePollInput,
  ): Promise<PublicPoll> {
    const data = {
      ...input,
      creatorId,
      shareId: randomUUID(),
    };

    try {
      return await this.repository.createPoll(data);
    } catch (error) {
      if (isUniqueViolation(error)) {
        try {
          return await this.repository.createPoll({
            ...data,
            shareId: randomUUID(),
          });
        } catch (retryError) {
          if (isUniqueViolation(retryError)) {
            throw new ConflictError("Unable to create poll share link");
          }
          throw retryError;
        }
      }
      throw error;
    }
  }

  async getById(
    id: string,
    viewerId?: string,
    viewerRole?: string,
  ): Promise<PublicPoll> {
    const poll = await this.repository.findById(id);

    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    assertPollReadable(poll, viewerId, viewerRole);
    return poll;
  }

  async getByShareId(
    shareId: string,
    viewerId?: string,
    viewerRole?: string,
  ): Promise<PublicPoll> {
    const poll = await this.repository.findByShareId(shareId);

    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    assertPollReadable(poll, viewerId, viewerRole);
    return poll;
  }

  async getFormByShareId(
    shareId: string,
    viewerId?: string,
    viewerRole?: string,
  ): Promise<PollForm> {
    const poll = await this.getByShareId(shareId, viewerId, viewerRole);
    const [questions, options] = await Promise.all([
      this.questionRepository.findByPollId(poll.id),
      this.optionRepository.findByPollId(poll.id),
    ]);

    const optionsByQuestionId = new Map<string, typeof options>();

    for (const option of options) {
      const list = optionsByQuestionId.get(option.questionId) ?? [];
      list.push(option);
      optionsByQuestionId.set(option.questionId, list);
    }

    return {
      poll,
      questions: questions.map((question) => ({
        ...question,
        options: optionsByQuestionId.get(question.id) ?? [],
      })),
    };
  }

  async listByCreator(
    creatorId: string,
    limit = 20,
    offset = 0,
  ): Promise<PaginatedPolls> {
    const [items, total] = await Promise.all([
      this.repository.findByCreatorId(creatorId, limit, offset),
      this.repository.countByCreatorId(creatorId),
    ]);

    return { items, total, limit, offset };
  }

  async listAll(limit = 20, offset = 0): Promise<PaginatedPolls> {
    const [items, total] = await Promise.all([
      this.repository.findAll(limit, offset),
      this.repository.countAll(),
    ]);

    return { items, total, limit, offset };
  }

  async updatePoll(
    id: string,
    actor: { id: string; role: string },
    data: UpdatePollData,
  ): Promise<PublicPoll> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError("Poll not found");
    }

    const isOwner = existing.creatorId === actor.id;
    const isAdmin = actor.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new NotFoundError("Poll not found");
    }

    const poll = await this.repository.updatePoll(
      id,
      data,
      isAdmin ? undefined : actor.id,
    );

    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    this.pollRealtime.pollUpdated(poll);

    if (!existing.resultPublished && poll.resultPublished) {
      const results = await this.resultService.buildPollResults(poll.id);
      this.pollRealtime.resultsUpdated(results);
    }

    return poll;
  }

  async deletePoll(
    id: string,
    actor: { id: string; role: string },
  ): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError("Poll not found");
    }

    const isOwner = existing.creatorId === actor.id;
    const isAdmin = actor.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new NotFoundError("Poll not found");
    }

    const deleted = await this.repository.deletePoll(
      id,
      isAdmin ? undefined : actor.id,
    );

    if (!deleted) {
      throw new NotFoundError("Poll not found");
    }

    this.pollRealtime.pollDeleted(id);
  }
}
