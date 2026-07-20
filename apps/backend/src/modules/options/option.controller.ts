import type { Request, Response } from "express";
import type { OptionService } from "./option.service";
import type { CreateOptionInput, UpdateOptionInput } from "./option.schema";
import { UnauthorizedError } from "../../errors/unauthorized.error";
import { sendSuccess } from "../../utils/response";

export class OptionController {
  constructor(private readonly service: OptionService) {}

  async create(
    req: Request<
      { pollId: string; questionId: string },
      unknown,
      CreateOptionInput
    >,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const data = await this.service.createOption(
      req.params.pollId,
      req.params.questionId,
      req.user.id,
      req.body,
    );

    return sendSuccess(res, {
      statusCode: 201,
      message: "Option created successfully",
      data,
    });
  }

  async listByQuestionId(
    req: Request<{ pollId: string; questionId: string }>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.listByQuestionId(
      req.params.pollId,
      req.params.questionId,
    );

    return sendSuccess(res, {
      message: "Options fetched successfully",
      data,
    });
  }

  async getById(
    req: Request<{ id: string; pollId: string; questionId: string }>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.getById(
      req.params.id,
      req.params.pollId,
      req.params.questionId,
    );

    return sendSuccess(res, {
      message: "Option fetched successfully",
      data,
    });
  }

  async update(
    req: Request<
      { id: string; pollId: string; questionId: string },
      unknown,
      UpdateOptionInput
    >,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const data = await this.service.updateOption(
      req.params.id,
      req.params.pollId,
      req.params.questionId,
      req.user.id,
      req.body,
    );

    return sendSuccess(res, {
      message: "Option updated successfully",
      data,
    });
  }

  async delete(
    req: Request<{ id: string; pollId: string; questionId: string }>,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    await this.service.deleteOption(
      req.params.id,
      req.params.pollId,
      req.params.questionId,
      req.user.id,
    );

    return sendSuccess(res, {
      message: "Option deleted successfully",
    });
  }
}
