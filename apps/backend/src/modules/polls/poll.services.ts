import { randomUUID } from "node:crypto";
import type { CreatePollInput } from "./poll.schema";
import type { PublicPoll, UpdatePollData } from "./poll.types";
import { pollRepository, type PollRepository } from "./poll.repository";
import { ConflictError } from "../../errors/conflict.error";
import { NotFoundError } from "../../errors/not-found.error";

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export class PollService {
  constructor(private readonly repository: PollRepository = pollRepository) {}

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

  async getById(id: string): Promise<PublicPoll> {
    const poll = await this.repository.findById(id);

    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    return poll;
  }

  async getByShareId(shareId: string): Promise<PublicPoll> {
    const poll = await this.repository.findByShareId(shareId);

    if (!poll) {
      throw new NotFoundError("Poll not found");
    }
    return poll;
  }

  async listByCreator(
    creatorId: string,
    limit = 20,
    offset = 0,
  ): Promise<PublicPoll[]> {
    return this.repository.findByCreatorId(creatorId, limit, offset);
  }

  async updatePoll(
    id: string,
    creatorId: string,
    data: UpdatePollData,
  ): Promise<PublicPoll> {
    const poll = await this.repository.updatePoll(id, creatorId, data);

    if (!poll) {
      throw new NotFoundError("Poll not found");
    }
    return poll;
  }

  async deletePoll(id: string, creatorId: string): Promise<void> {
    const deleted = await this.repository.deletePoll(id, creatorId);

    if (!deleted) {
      throw new NotFoundError("Poll not found");
    }
  }
}

export const pollService = new PollService();
