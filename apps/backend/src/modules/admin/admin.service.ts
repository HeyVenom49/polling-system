import { NotFoundError } from "../../errors/not-found.error";
import type { AuthRepository } from "../auth/auth.repository";
import type { PublicUser } from "../auth/auth.types";
import type { PollService } from "../polls/poll.services";
import type { PaginatedPolls } from "../polls/poll.types";
import type {
  UpdateUserPlanInput,
  UpdateUserRoleInput,
} from "./admin.schema";

export type PaginatedUsers = {
  items: PublicUser[];
  total: number;
  limit: number;
  offset: number;
};

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

  async updateUserPlan(
    userId: string,
    input: UpdateUserPlanInput,
  ): Promise<PublicUser> {
    const user = await this.authRepository.updatePlan(userId, input.plan);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }

  async searchUsers(
    query: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedUsers> {
    const result = await this.authRepository.searchUsers(query, limit, offset);
    return { ...result, limit, offset };
  }

  async listPolls(limit: number, offset: number): Promise<PaginatedPolls> {
    return this.pollService.listAll(limit, offset);
  }
}
