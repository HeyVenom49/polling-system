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

export type ResponseDayCount = {
  date: string;
  count: number;
};

export type RecentResponse = {
  id: string;
  identityType: "user" | "guest";
  submittedAt: Date;
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
