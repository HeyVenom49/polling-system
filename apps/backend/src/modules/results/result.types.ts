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
