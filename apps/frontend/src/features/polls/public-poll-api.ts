import type { SubmitResponseInput } from "@polling-system/shared";
import { apiRequest, getAccessToken } from "@/lib/api";
import type { Option, Poll, Question } from "@/features/polls/poll-api";

export type PollFormQuestion = Question & {
  options: Option[];
};

export type PollForm = {
  poll: Poll;
  questions: PollFormQuestion[];
};

export type OptionResult = {
  id: string;
  value: string;
  displayOrder: number;
  count: number;
  percentage: number;
};

export type QuestionResult = {
  id: string;
  title: string;
  displayOrder: number;
  totalAnswers: number;
  options: OptionResult[];
};

export type PollResults = {
  pollId: string;
  totalResponses: number;
  questions: QuestionResult[];
};

export type SubmitResponseResult = {
  response: {
    id: string;
    pollId: string;
    userId: string | null;
    guestId: string | null;
    submittedAt: string;
  };
  answers: Array<{
    id: string;
    responseId: string;
    questionId: string;
    optionId: string;
  }>;
};

function optionalAuth(): boolean {
  return Boolean(getAccessToken());
}

export async function getPollFormByShareId(
  shareId: string,
): Promise<PollForm> {
  return apiRequest<PollForm>(`/polls/share/${shareId}/form`, {
    auth: optionalAuth(),
  });
}

export async function submitPollResponse(
  pollId: string,
  input: SubmitResponseInput,
): Promise<SubmitResponseResult> {
  return apiRequest<SubmitResponseResult>(`/polls/${pollId}/responses`, {
    method: "POST",
    auth: optionalAuth(),
    body: input,
  });
}

export async function getPollResults(pollId: string): Promise<PollResults> {
  return apiRequest<PollResults>(`/polls/${pollId}/results`, {
    auth: optionalAuth(),
  });
}

export type ResponseDayCount = {
  date: string;
  count: number;
};

export type RecentResponse = {
  id: string;
  identityType: "user" | "guest";
  submittedAt: string;
};

export type PollAnalytics = {
  pollId: string;
  totalResponses: number;
  guestResponses: number;
  authenticatedResponses: number;
  responsesByDay: ResponseDayCount[];
  recentResponses: RecentResponse[];
  results: PollResults;
};

export async function getPollAnalytics(
  pollId: string,
): Promise<PollAnalytics> {
  return apiRequest<PollAnalytics>(`/polls/${pollId}/results/analytics`, {
    auth: true,
  });
}
