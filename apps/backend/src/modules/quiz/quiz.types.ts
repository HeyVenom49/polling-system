import type { PublicPoll } from "../polls/poll.types";
import type { PublicQuestion } from "../questions/question.types";

export type QuizPublicOption = {
  id: string;
  questionId: string;
  value: string;
  displayOrder: number;
  isCorrect?: boolean;
};

export type QuizQuestionView = PublicQuestion & {
  options: QuizPublicOption[];
};

export type QuizLeaderboardEntry = {
  userId: string;
  username: string;
  correctCount: number;
  answeredCount: number;
};

export type QuizState = {
  poll: PublicPoll;
  currentQuestion: QuizQuestionView | null;
  leaderboard: QuizLeaderboardEntry[];
  myAnsweredQuestionIds: string[];
  serverNow: string;
};
