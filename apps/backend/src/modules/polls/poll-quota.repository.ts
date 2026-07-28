import {
  FREE_DAILY_POLL_LIMIT,
  type PlanUsage,
  type UserPlan,
} from "@polling-system/shared";
import { TooManyRequestsError } from "../../errors/too-many-requests.error";
import type { Cache } from "../../infrastructure/cache/cache";

const QUOTA_PREFIX = "poll:create-quota:";

function utcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function quotaKey(userId: string, day = utcDayKey()): string {
  return `${QUOTA_PREFIX}${userId}:${day}`;
}

function secondsUntilUtcMidnight(now = new Date()): number {
  const nextMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.max(1, Math.ceil((nextMidnight - now.getTime()) / 1_000));
}

export class PollQuotaRepository {
  constructor(private readonly cache: Cache) {}

  async getCreatedToday(userId: string): Promise<number> {
    const value = await this.cache.get(quotaKey(userId));
    return value === null ? 0 : Number(value);
  }

  async getUsage(userId: string, plan: UserPlan): Promise<PlanUsage> {
    const pollsCreatedToday = await this.getCreatedToday(userId);

    return {
      pollsCreatedToday,
      dailyLimit: plan === "pro" ? null : FREE_DAILY_POLL_LIMIT,
    };
  }

  /**
   * Atomically reserves one create slot for free-plan users.
   * Caller must `releaseCreate` if the create fails after reservation.
   */
  async reserveCreate(userId: string, plan: UserPlan): Promise<number> {
    if (plan === "pro") {
      return this.getCreatedToday(userId);
    }

    const count = await this.cache.increment(
      quotaKey(userId),
      secondsUntilUtcMidnight(),
    );

    if (count > FREE_DAILY_POLL_LIMIT) {
      await this.cache.decrement(quotaKey(userId));
      throw new TooManyRequestsError(
        `Free plan allows ${FREE_DAILY_POLL_LIMIT} polls per day. Upgrade to Pro for unlimited creates.`,
      );
    }

    return count;
  }

  async releaseCreate(userId: string, plan: UserPlan): Promise<void> {
    if (plan === "pro") {
      return;
    }

    await this.cache.decrement(quotaKey(userId));
  }
}
