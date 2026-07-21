import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import type {
  AdminListPollsQuery,
  UpdateUserRoleInput,
} from "./admin.schema";
import type { AdminService } from "./admin.service";

export class AdminController {
  constructor(private readonly service: AdminService) {}

  async updateUserRole(
    req: Request<{ id: string }, unknown, UpdateUserRoleInput>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.updateUserRole(req.params.id, req.body);

    return sendSuccess(res, {
      message: "User role updated successfully",
      data,
    });
  }

  async listPolls(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as AdminListPollsQuery;
    const data = await this.service.listPolls(query.limit, query.offset);

    return sendSuccess(res, {
      message: "Polls fetched successfully",
      data,
    });
  }
}
