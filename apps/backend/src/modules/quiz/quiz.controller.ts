import type { Request, Response } from "express";
import { UnauthorizedError } from "../../errors/unauthorized.error";
import { sendSuccess } from "../../utils/response";
import type {
  StartQuizQuestionInput,
  SubmitQuizAnswerInput,
} from "./quiz.schema";
import type { QuizService } from "./quiz.service";

export class QuizController {
  constructor(private readonly service: QuizService) {}

  async getState(
    req: Request<{ pollId: string }>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.getState(
      req.params.pollId,
      req.user
        ? { id: req.user.id, role: req.user.role }
        : undefined,
    );

    return sendSuccess(res, {
      message: "Quiz state fetched",
      data,
    });
  }

  async getStateByShareId(
    req: Request<{ shareId: string }>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.getStateByShareId(
      req.params.shareId,
      req.user
        ? { id: req.user.id, role: req.user.role }
        : undefined,
    );

    return sendSuccess(res, {
      message: "Quiz state fetched",
      data,
    });
  }

  async startQuestion(
    req: Request<{ pollId: string }, unknown, StartQuizQuestionInput>,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const data = await this.service.startQuestion(
      req.params.pollId,
      { id: req.user.id, role: req.user.role },
      req.body,
    );

    return sendSuccess(res, {
      message: "Question started",
      data,
    });
  }

  async closeQuestion(
    req: Request<{ pollId: string }>,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const data = await this.service.closeQuestion(req.params.pollId, {
      id: req.user.id,
      role: req.user.role,
    });

    return sendSuccess(res, {
      message: "Question closed",
      data,
    });
  }

  async finish(
    req: Request<{ pollId: string }>,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const data = await this.service.finish(req.params.pollId, {
      id: req.user.id,
      role: req.user.role,
    });

    return sendSuccess(res, {
      message: "Quiz finished",
      data,
    });
  }

  async resetToLobby(
    req: Request<{ pollId: string }>,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const data = await this.service.resetToLobby(req.params.pollId, {
      id: req.user.id,
      role: req.user.role,
    });

    return sendSuccess(res, {
      message: "Quiz reset to lobby",
      data,
    });
  }

  async submitAnswer(
    req: Request<{ pollId: string }, unknown, SubmitQuizAnswerInput>,
    res: Response,
  ): Promise<Response> {
    const data = await this.service.submitAnswer(
      req.params.pollId,
      req.user?.id,
      req.body,
    );

    return sendSuccess(res, {
      message: "Answer submitted",
      data,
    });
  }

  async getLeaderboard(
    req: Request<{ pollId: string }>,
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const data = await this.service.getLeaderboard(req.params.pollId, {
      id: req.user.id,
      role: req.user.role,
    });

    return sendSuccess(res, {
      message: "Leaderboard fetched",
      data,
    });
  }
}
