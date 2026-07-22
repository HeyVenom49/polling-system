import type {
  CreatePollInput,
  ListPollsQuery,
  PollThemeId,
  UpdatePollInput,
} from "@polling-system/shared";
import { apiRequest } from "@/lib/api";

export type Poll = {
  id: string;
  title: string;
  description: string | null;
  creatorId: string;
  requireAuthentication: boolean;
  expireAt: string | null;
  status: "open" | "closed";
  resultPublished: boolean;
  themeId: PollThemeId;
  shareId: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedPolls = {
  items: Poll[];
  total: number;
  limit: number;
  offset: number;
};

export type Question = {
  id: string;
  pollId: string;
  title: string;
  isMandatory: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Option = {
  id: string;
  questionId: string;
  value: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export function sharePollUrl(shareId: string): string {
  return `${window.location.origin}/p/${shareId}`;
}

export async function listMyPolls(
  query: Partial<ListPollsQuery> = {},
): Promise<PaginatedPolls> {
  const params = new URLSearchParams();
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) params.set("offset", String(query.offset));
  const qs = params.toString();
  return apiRequest<PaginatedPolls>(`/polls${qs ? `?${qs}` : ""}`, {
    auth: true,
  });
}

export async function getPoll(id: string): Promise<Poll> {
  return apiRequest<Poll>(`/polls/${id}`, { auth: true });
}

export async function createPoll(input: CreatePollInput): Promise<Poll> {
  return apiRequest<Poll>("/polls", {
    method: "POST",
    auth: true,
    body: input,
  });
}

export async function updatePoll(
  id: string,
  input: UpdatePollInput,
): Promise<Poll> {
  return apiRequest<Poll>(`/polls/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });
}

export async function deletePoll(id: string): Promise<void> {
  await apiRequest(`/polls/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function listQuestions(pollId: string): Promise<Question[]> {
  return apiRequest<Question[]>(`/polls/${pollId}/questions`, { auth: true });
}

export async function createQuestion(
  pollId: string,
  input: { title: string; isMandatory?: boolean; displayOrder: number },
): Promise<Question> {
  return apiRequest<Question>(`/polls/${pollId}/questions`, {
    method: "POST",
    auth: true,
    body: input,
  });
}

export async function updateQuestion(
  pollId: string,
  questionId: string,
  input: { title?: string; isMandatory?: boolean; displayOrder?: number },
): Promise<Question> {
  return apiRequest<Question>(`/polls/${pollId}/questions/${questionId}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });
}

export async function deleteQuestion(
  pollId: string,
  questionId: string,
): Promise<void> {
  await apiRequest(`/polls/${pollId}/questions/${questionId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function reorderQuestions(
  pollId: string,
  orderedIds: string[],
): Promise<Question[]> {
  return apiRequest<Question[]>(`/polls/${pollId}/questions/reorder`, {
    method: "PUT",
    auth: true,
    body: { orderedIds },
  });
}

export async function listOptions(
  pollId: string,
  questionId: string,
): Promise<Option[]> {
  return apiRequest<Option[]>(
    `/polls/${pollId}/questions/${questionId}/options`,
    { auth: true },
  );
}

export async function createOption(
  pollId: string,
  questionId: string,
  input: { value: string; displayOrder: number },
): Promise<Option> {
  return apiRequest<Option>(
    `/polls/${pollId}/questions/${questionId}/options`,
    {
      method: "POST",
      auth: true,
      body: input,
    },
  );
}

export async function updateOption(
  pollId: string,
  questionId: string,
  optionId: string,
  input: { value?: string; displayOrder?: number },
): Promise<Option> {
  return apiRequest<Option>(
    `/polls/${pollId}/questions/${questionId}/options/${optionId}`,
    {
      method: "PATCH",
      auth: true,
      body: input,
    },
  );
}

export async function deleteOption(
  pollId: string,
  questionId: string,
  optionId: string,
): Promise<void> {
  await apiRequest(
    `/polls/${pollId}/questions/${questionId}/options/${optionId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}
