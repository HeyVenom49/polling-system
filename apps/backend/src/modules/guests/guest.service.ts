import { NotFoundError } from "../../errors/not-found.error";
import type { GuestRepository } from "./guest.repository";
import type { PublicGuest } from "./guest.types";

export class GuestService {
  constructor(private readonly repository: GuestRepository) {}

  async createGuest(): Promise<PublicGuest> {
    return this.repository.create();
  }

  async findById(id: string): Promise<PublicGuest> {
    const guest = await this.repository.findById(id);

    if (!guest) {
      throw new NotFoundError("Guest not found");
    }

    return guest;
  }
}
