import type {
  StartQuizQuestionInput,
  SubmitQuizAnswerInput,
} from "@polling-system/shared";
import { apiRequest, getAccessToken } from "@/lib/api";
import type { Option, Poll, Question } from "@/features/polls/poll-api";

export type QuizPublicOption = Omit<
  Option,
  "isCorrect" | "createdAt" | "updatedAt"
> & {
  isCorrect?: boolean;
};

export type QuizQuestionView = Question & {
  options: QuizPublicOption[];
};

export type QuizLeaderboardEntry = {
  userId: string;
  username: string;
  correctCount: number;
  answeredCount: number;
};

export type QuizState = {
  poll: Poll;
  currentQuestion: QuizQuestionView | null;
  leaderboard: QuizLeaderboardEntry[];
  myAnsweredQuestionIds: string[];
  serverNow: string;
};

export async function getQuizStateByShareId(
  shareId: string,
): Promise<QuizState> {
  return apiRequest<QuizState>(`/polls/share/${shareId}/quiz`, {
    auth: Boolean(getAccessToken()),
  });
}

export async function getQuizState(pollId: string): Promise<QuizState> {
  return apiRequest<QuizState>(`/polls/${pollId}/quiz/state`, {
    auth: true,
  });
}

export async function startQuizQuestion(
  pollId: string,
  input: StartQuizQuestionInput,
): Promise<QuizState> {
  return apiRequest<QuizState>(`/polls/${pollId}/quiz/questions/start`, {
    method: "POST",
    auth: true,
    body: input,
  });
}

export async function closeQuizQuestion(pollId: string): Promise<QuizState> {
  return apiRequest<QuizState>(`/polls/${pollId}/quiz/questions/close`, {
    method: "POST",
    auth: true,
  });
}

export async function finishQuiz(pollId: string): Promise<QuizState> {
  return apiRequest<QuizState>(`/polls/${pollId}/quiz/finish`, {
    method: "POST",
    auth: true,
  });
}

export async function resetQuizLobby(pollId: string): Promise<QuizState> {
  return apiRequest<QuizState>(`/polls/${pollId}/quiz/lobby`, {
    method: "POST",
    auth: true,
  });
}

export async function submitQuizAnswer(
  pollId: string,
  input: SubmitQuizAnswerInput,
): Promise<{ correct: boolean | null }> {
  return apiRequest<{ correct: boolean | null }>(
    `/polls/${pollId}/quiz/answers`,
    {
      method: "POST",
      auth: true,
      body: input,
    },
  );
}
