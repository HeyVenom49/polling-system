export const BRAND_NAME = "Ballotly";

export const FREE_DAILY_POLL_LIMIT = 5;

export const USER_PLANS = ["free", "pro"] as const;
export type UserPlan = (typeof USER_PLANS)[number];

export const POLL_STATUSES = ["open", "closed"] as const;
export type PollStatus = (typeof POLL_STATUSES)[number];

export const POLL_MODES = ["poll", "quiz"] as const;
export type PollMode = (typeof POLL_MODES)[number];

export const QUIZ_STATUSES = [
  "lobby",
  "question_open",
  "question_closed",
  "finished",
] as const;
export type QuizStatus = (typeof QUIZ_STATUSES)[number];

export const QUIZ_DURATION_SECONDS = [10, 15, 20, 30, 45, 60, 90] as const;
export type QuizDurationSeconds = (typeof QUIZ_DURATION_SECONDS)[number];
export const DEFAULT_QUIZ_DURATION_SECONDS = 30;
