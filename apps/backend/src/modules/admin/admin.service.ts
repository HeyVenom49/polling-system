import { NotFoundError } from "../../errors/not-found.error";
import type { AuthRepository } from "../auth/auth.repository";
import type { PublicUser } from "../auth/auth.types";
import type { PollService } from "../polls/poll.services";
import type { PaginatedPolls } from "../polls/poll.types";
import type { UpdateUserRoleInput } from "./admin.schema";

export class AdminService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly pollService: PollService,
  ) {}

  async updateUserRole(
    userId: string,
    input: UpdateUserRoleInput,
  ): Promise<PublicUser> {
    const user = await this.authRepository.updateRole(userId, input.role);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }

  async listPolls(limit: number, offset: number): Promise<PaginatedPolls> {
    return this.pollService.listAll(limit, offset);
  }
}
