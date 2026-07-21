import type { Request, Response } from "express";
import type { ResponseService } from "./response.service";
import type { SubmitResponseInput } from "./response.schema";
import { sendSuccess } from "../../utils/response";

export class ResponseController {
  constructor(private readonly service: ResponseService) {}

  async submit(
    req: Request<{ pollId: string }, unknown, SubmitResponseInput>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.submitResponse(
      req.params.pollId,
      req.user?.id,
      req.guestId,
      req.body,
    );

    return sendSuccess(res, {
      statusCode: 201,
      message: "Response submitted successfully",
      data,
    });
  }

  async getById(
    req: Request<{ pollId: string; id: string }>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.getById(req.params.id, req.params.pollId);

    return sendSuccess(res, {
      message: "Response fetched successfully",
      data,
    });
  }
}
