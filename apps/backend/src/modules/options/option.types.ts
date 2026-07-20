import type { options } from "../../database/schema";
import type { CreateOptionInput, UpdateOptionInput } from "./option.schema";

type OptionRecord = typeof options.$inferSelect;

export type PublicOption = Pick<
  OptionRecord,
  "id" | "questionId" | "value" | "displayOrder" | "createdAt" | "updatedAt"
>;

export type CreateOptionData = CreateOptionInput & { questionId: string };

export type UpdateOptionData = UpdateOptionInput;
