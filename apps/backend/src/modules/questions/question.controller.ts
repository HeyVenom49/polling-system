import type { Request, Response } from "express";
import { UnauthorizedError } from "../../errors/unauthorized.error";
import { sendSuccess } from "../../utils/response";
import type {
  CreateQuestionInput,
  UpdateQuestionInput,
} from "./question.schema";
import type { QuestionService } from "./question.service";

export class QuestionController {
  constructor(private readonly service: QuestionService) {}

  async create(
    req: Request<{ pollId: string }, unknown, CreateQuestionInput>,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const data = await this.service.createQuestion(
      req.params.pollId,
      req.user.id,
      req.body,
    );

    return sendSuccess(res, {
      statusCode: 201,
      message: "Question created successfully",
      data,
    });
  }

  async listByPollId(
    req: Request<{ pollId: string }>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.listByPollId(req.params.pollId);

    return sendSuccess(res, {
      message: "Questions fetched successfully",
      data,
    });
  }

  async getById(
    req: Request<{ id: string; pollId: string }>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.getById(req.params.id, req.params.pollId);

    return sendSuccess(res, {
      message: "Question fetched successfully",
      data,
    });
  }

  async update(
    req: Request<{ id: string; pollId: string }, unknown, UpdateQuestionInput>,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const data = await this.service.updateQuestion(
      req.params.id,
      req.params.pollId,
      req.user.id,
      req.body,
    );

    return sendSuccess(res, {
      message: "Question updated successfully",
      data,
    });
  }

  async delete(
    req: Request<{ id: string; pollId: string }>,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    await this.service.deleteQuestion(
      req.params.id,
      req.params.pollId,
      req.user.id,
    );

    return sendSuccess(res, {
      message: "Question deleted successfully",
    });
  }
}
