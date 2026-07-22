import { and, count, desc, eq } from "drizzle-orm";
import type { Database } from "../../infrastructure/postgres/postgres-client";
import { polls } from "../../database/schema";
import type { CreatePollData, PublicPoll, UpdatePollData } from "./poll.types";

const publicPollSelect = {
  id: polls.id,
  title: polls.title,
  description: polls.description,
  creatorId: polls.creatorId,
  requireAuthentication: polls.requireAuthentication,
  expireAt: polls.expireAt,
  status: polls.status,
  resultPublished: polls.resultPublished,
  themeId: polls.themeId,
  shareId: polls.shareId,
  createdAt: polls.createdAt,
  updatedAt: polls.updatedAt,
} as const;

export class PollRepository {
  constructor(private readonly db: Database) {}

  async createPoll(data: CreatePollData): Promise<PublicPoll> {
    const [poll] = await this.db
      .insert(polls)
      .values(data)
      .returning(publicPollSelect);

    if (!poll) {
      throw new Error("Poll creation failed: no row returned");
    }

    return poll;
  }

  async findById(id: string): Promise<PublicPoll | null> {
    const [poll] = await this.db
      .select(publicPollSelect)
      .from(polls)
      .where(eq(polls.id, id))
      .limit(1);

    return poll ?? null;
  }

  async findByShareId(shareId: string): Promise<PublicPoll | null> {
    const [poll] = await this.db
      .select(publicPollSelect)
      .from(polls)
      .where(eq(polls.shareId, shareId))
      .limit(1);

    return poll ?? null;
  }

  async findByCreatorId(
    creatorId: string,
    limit = 20,
    offset = 0,
  ): Promise<PublicPoll[]> {
    return this.db
      .select(publicPollSelect)
      .from(polls)
      .where(eq(polls.creatorId, creatorId))
      .orderBy(desc(polls.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countByCreatorId(creatorId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(polls)
      .where(eq(polls.creatorId, creatorId));

    return Number(row?.value ?? 0);
  }

  async updatePoll(
    id: string,
    data: UpdatePollData,
    creatorId?: string,
  ): Promise<PublicPoll | null> {
    const where =
      creatorId === undefined
        ? eq(polls.id, id)
        : and(eq(polls.id, id), eq(polls.creatorId, creatorId));

    const [poll] = await this.db
      .update(polls)
      .set({ ...data, updatedAt: new Date() })
      .where(where)
      .returning(publicPollSelect);

    return poll ?? null;
  }

  async deletePoll(id: string, creatorId?: string): Promise<boolean> {
    const where =
      creatorId === undefined
        ? eq(polls.id, id)
        : and(eq(polls.id, id), eq(polls.creatorId, creatorId));

    const deleted = await this.db
      .delete(polls)
      .where(where)
      .returning({ id: polls.id });

    return deleted.length > 0;
  }

  async findAll(limit = 20, offset = 0): Promise<PublicPoll[]> {
    return this.db
      .select(publicPollSelect)
      .from(polls)
      .orderBy(desc(polls.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countAll(): Promise<number> {
    const [row] = await this.db.select({ value: count() }).from(polls);
    return Number(row?.value ?? 0);
  }
}
