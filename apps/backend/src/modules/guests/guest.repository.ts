import { eq } from "drizzle-orm";
import { guests } from "../../database/schema";
import type { Database } from "../../infrastructure/postgres/postgres-client";
import type { PublicGuest } from "./guest.types";

const publicGuestSelect = {
  id: guests.id,
  createdAt: guests.createdAt,
} as const;

export class GuestRepository {
  constructor(private readonly db: Database) {}

  async create(): Promise<PublicGuest> {
    const [guest] = await this.db
      .insert(guests)
      .values({})
      .returning(publicGuestSelect);

    if (!guest) {
      throw new Error("Guest creation failed: no row returned");
    }

    return guest;
  }

  async findById(id: string): Promise<PublicGuest | null> {
    const [guest] = await this.db
      .select(publicGuestSelect)
      .from(guests)
      .where(eq(guests.id, id))
      .limit(1);

    return guest ?? null;
  }
}
