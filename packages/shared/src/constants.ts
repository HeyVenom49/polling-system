export const BRAND_NAME = "Ballotly";

export const FREE_DAILY_POLL_LIMIT = 5;

export const USER_PLANS = ["free", "pro"] as const;
export type UserPlan = (typeof USER_PLANS)[number];

export const POLL_STATUSES = ["open", "closed"] as const;
export type PollStatus = (typeof POLL_STATUSES)[number];
