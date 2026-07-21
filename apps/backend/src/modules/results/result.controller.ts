import type { Request, Response } from "express";
import type { ResultService } from "./result.service";
import { UnauthorizedError } from "../../errors/unauthorized.error";
import { sendSuccess } from "../../utils/response";

export class ResultController {
  constructor(private readonly service: ResultService) {}

  async getByPollId(req: Request<{ pollId: string }>, res: Response) {
    const data = await this.service.getPollResults(
      req.params.pollId,
      req.user?.id,
      req.user?.role,
    );
    return sendSuccess(res, {
      message: "Results fetched successfully",
      data,
    });
  }

  async getAnalytics(req: Request<{ pollId: string }>, res: Response) {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const data = await this.service.getPollAnalytics(
      req.params.pollId,
      req.user.id,
      req.user.role,
    );

    return sendSuccess(res, {
      message: "Analytics fetched successfully",
      data,
    });
  }
}
