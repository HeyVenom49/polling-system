import type { Request, Response } from "express";
import type { ResultService } from "./result.service";
import { sendSuccess } from "../../utils/response";

export class ResultController {
  constructor(private readonly service: ResultService) {}

  async getByPollId(req: Request<{ pollId: string }>, res: Response) {
    const data = await this.service.getPollResults(
      req.params.pollId,
      req.user?.id,
    );
    return sendSuccess(res, {
      message: "Results fetched successfully",
      data,
    });
  }
}
