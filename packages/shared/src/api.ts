export type ApiSuccess<T = unknown> = {
  success: true;
  message: string;
  data?: T;
};

export type ApiFailure = {
  success: false;
  message: string;
  errors?: unknown;
};

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiFailure;

export type PlanUsage = {
  pollsCreatedToday: number;
  /** `null` means unlimited (Pro). */
  dailyLimit: number | null;
};
