import { randomUUID } from "node:crypto";
import type { UserPlan } from "@polling-system/shared";
import type { CreatePollInput } from "./poll.schema";
import type {
  PaginatedPolls,
  PollForm,
  PublicPoll,
  UpdatePollData,
} from "./poll.types";
import type { PollRepository } from "./poll.repository";
import type { PollQuotaRepository } from "./poll-quota.repository";
import { ConflictError } from "../../errors/conflict.error";
import { NotFoundError } from "../../errors/not-found.error";
import type { PollRealtime } from "../../infrastructure/socket/poll-realtime";
import type { OptionRepository } from "../options/option.repository";
import type { QuestionRepository } from "../questions/question.repository";
import type { ResultService } from "../results/result.service";
import { assertPollReadable } from "./poll-access";
import { isUniqueViolation } from "../../utils/db-errors";

export class PollService {
  constructor(
    private readonly repository: PollRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly optionRepository: OptionRepository,
    private readonly pollRealtime: PollRealtime,
    private readonly resultService: ResultService,
    private readonly quotaRepository: PollQuotaRepository,
  ) {}

  async createPoll(
    creator: { id: string; plan: UserPlan },
    input: CreatePollInput,
  ): Promise<PublicPoll> {
    await this.quotaRepository.reserveCreate(creator.id, creator.plan);

    const data = {
      ...input,
      creatorId: creator.id,
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
          await this.quotaRepository.releaseCreate(creator.id, creator.plan);
          if (isUniqueViolation(retryError)) {
            throw new ConflictError("Unable to create poll share link");
          }
          throw retryError;
        }
      }
      await this.quotaRepository.releaseCreate(creator.id, creator.plan);
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
