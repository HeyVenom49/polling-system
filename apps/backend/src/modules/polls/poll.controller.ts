import type { Request, Response } from "express";

import type { CreatePollInput, UpdatePollInput } from "./poll.schema";
import type { PollService } from "./poll.services";
import { UnauthorizedError } from "../../errors/unauthorized.error";
import { sendSuccess } from "../../utils/response";

export class PollController {
  constructor(private readonly service: PollService) {}

  async create(
    req: Request<Record<string, never>, unknown, CreatePollInput>,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const data = await this.service.createPoll(req.user.id, req.body);

    return sendSuccess(res, {
      statusCode: 201,
      message: "Poll created successfully",
      data,
    });
  }

  async getById(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.getById(req.params.id);

    return sendSuccess(res, {
      message: "Poll fetched successfully",
      data,
    });
  }

  async getByShareId(
    req: Request<{ shareId: string }>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.getByShareId(req.params.shareId);

    return sendSuccess(res, {
      message: "Poll fetched successfully",
      data,
    });
  }

  async listMine(req: Request, res: Response): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const data = await this.service.listByCreator(req.user.id);

    return sendSuccess(res, {
      message: "Poll fetched successfully",
      data,
    });
  }

  async update(
    req: Request<{ id: string }, unknown, UpdatePollInput>,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const data = await this.service.updatePoll(
      req.params.id,
      req.user.id,
      req.body,
    );

    return sendSuccess(res, {
      message: "Poll updated successfully",
      data,
    });
  }

  async delete(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    await this.service.deletePoll(req.params.id, req.user.id);

    return sendSuccess(res, {
      message: "Poll deleted successfully",
    });
  }
}
