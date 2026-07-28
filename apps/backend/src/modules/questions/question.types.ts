import type { questions } from "../../database/schema";
import type {
  CreateQuestionInput,
  UpdateQuestionInput,
} from "./question.schema";

type QuestionRecord = typeof questions.$inferSelect;

export type PublicQuestion = Pick<
  QuestionRecord,
  | "id"
  | "pollId"
  | "title"
  | "isMandatory"
  | "displayOrder"
  | "createdAt"
  | "updatedAt"
>;

export type CreateQuestionData = CreateQuestionInput & { pollId: string };

export type UpdateQuestionData = UpdateQuestionInput;
