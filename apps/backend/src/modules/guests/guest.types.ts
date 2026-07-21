import type { guests } from "../../database/schema";

type GuestRecord = typeof guests.$inferSelect;

export type PublicGuest = Pick<GuestRecord, "id" | "createdAt">;
