import {
  DEFAULT_QUIZ_DURATION_SECONDS,
  type StartQuizQuestionInput,
  type SubmitQuizAnswerInput,
} from "@polling-system/shared";
import { ConflictError } from "../../errors/conflict.error";
import { ForbiddenError } from "../../errors/forbidden.error";
import { NotFoundError } from "../../errors/not-found.error";
import { UnauthorizedError } from "../../errors/unauthorized.error";
import { ValidationError } from "../../errors/validation.error";
import type { PollRealtime } from "../../infrastructure/socket/poll-realtime";
import { isUniqueViolation } from "../../utils/db-errors";
import type { OptionRepository } from "../options/option.repository";
import type { PollRepository } from "../polls/poll.repository";
import type { PublicPoll } from "../polls/poll.types";
import type { QuestionRepository } from "../questions/question.repository";
import type { ResponseRepository } from "../responses/response.repository";
import type { QuizRepository } from "./quiz.repository";
import type {
  QuizPublicOption,
  QuizQuestionView,
  QuizState,
} from "./quiz.types";

export class QuizService {
  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly pollRepository: PollRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly optionRepository: OptionRepository,
    private readonly responseRepository: ResponseRepository,
    private readonly pollRealtime: PollRealtime,
  ) {}

  private assertQuiz(poll: PublicPoll): void {
    if (poll.mode !== "quiz") {
      throw new ValidationError([], "This poll is not a live quiz");
    }
  }

  private async assertOwned(
    poll: PublicPoll,
    actor: { id: string; role: string },
  ): Promise<void> {
    if (poll.creatorId !== actor.id && actor.role !== "admin") {
      throw new NotFoundError("Poll not found");
    }
  }

  private stripCorrect(options: QuizPublicOption[]): QuizPublicOption[] {
    return options.map(({ isCorrect: _ignored, ...rest }) => rest);
  }

  private async loadQuestionView(
    pollId: string,
    questionId: string,
    revealCorrect: boolean,
  ): Promise<QuizQuestionView> {
    const question = await this.questionRepository.findById(questionId, pollId);
    if (!question) {
      throw new NotFoundError("Question not found");
    }
    const options = await this.optionRepository.findByQuestionId(questionId);
    const mapped: QuizPublicOption[] = options.map((option) => ({
      id: option.id,
      questionId: option.questionId,
      value: option.value,
      displayOrder: option.displayOrder,
      isCorrect: option.isCorrect,
    }));

    return {
      ...question,
      options: revealCorrect ? mapped : this.stripCorrect(mapped),
    };
  }

  /** Auto-close when the timer has elapsed. */
  private async syncExpiredQuestion(poll: PublicPoll): Promise<PublicPoll> {
    if (
      poll.quizStatus !== "question_open" ||
      !poll.questionEndsAt ||
      poll.questionEndsAt > new Date()
    ) {
      return poll;
    }

    const updated = await this.pollRepository.updatePoll(poll.id, {
      quizStatus: "question_closed",
      questionEndsAt: poll.questionEndsAt,
    });

    if (!updated) {
      return poll;
    }

    this.pollRealtime.pollUpdated(updated);
    this.pollRealtime.quizQuestionClosed(updated);
    return updated;
  }

  async getState(
    pollId: string,
    viewer?: { id: string; role: string },
  ): Promise<QuizState> {
    let poll = await this.pollRepository.findById(pollId);
    if (!poll) {
      throw new NotFoundError("Poll not found");
    }
    this.assertQuiz(poll);
    poll = await this.syncExpiredQuestion(poll);

    const isOwner =
      viewer !== undefined &&
      (viewer.id === poll.creatorId || viewer.role === "admin");

    let currentQuestion: QuizQuestionView | null = null;
    if (poll.currentQuestionId) {
      const showQuestion =
        isOwner ||
        poll.quizStatus === "question_open" ||
        poll.quizStatus === "question_closed" ||
        poll.quizStatus === "finished";

      if (showQuestion) {
        const revealCorrect =
          isOwner ||
          poll.quizStatus === "question_closed" ||
          poll.quizStatus === "finished";
        currentQuestion = await this.loadQuestionView(
          poll.id,
          poll.currentQuestionId,
          revealCorrect,
        );
      }
    }

    const leaderboard =
      isOwner ||
      poll.quizStatus === "question_closed" ||
      poll.quizStatus === "finished"
        ? await this.quizRepository.getLeaderboard(poll.id)
        : [];

    let myAnsweredQuestionIds: string[] = [];
    if (viewer?.id) {
      const response = await this.responseRepository.findByPollAndUser(
        poll.id,
        viewer.id,
      );
      if (response) {
        const answers = await this.responseRepository.findAnswersByResponseId(
          response.id,
        );
        myAnsweredQuestionIds = answers.map((answer) => answer.questionId);
      }
    }

    return {
      poll,
      currentQuestion,
      leaderboard,
      myAnsweredQuestionIds,
      serverNow: new Date().toISOString(),
    };
  }

  async getStateByShareId(
    shareId: string,
    viewer?: { id: string; role: string },
  ): Promise<QuizState> {
    const poll = await this.pollRepository.findByShareId(shareId);
    if (!poll) {
      throw new NotFoundError("Poll not found");
    }
    return this.getState(poll.id, viewer);
  }

  async startQuestion(
    pollId: string,
    actor: { id: string; role: string },
    input: StartQuizQuestionInput,
  ): Promise<QuizState> {
    let poll = await this.pollRepository.findById(pollId);
    if (!poll) {
      throw new NotFoundError("Poll not found");
    }
    this.assertQuiz(poll);
    await this.assertOwned(poll, actor);
    poll = await this.syncExpiredQuestion(poll);

    if (poll.quizStatus === "finished") {
      throw new ValidationError([], "Quiz is finished");
    }

    const question = await this.questionRepository.findById(
      input.questionId,
      pollId,
    );
    if (!question) {
      throw new NotFoundError("Question not found");
    }

    const options = await this.optionRepository.findByQuestionId(
      input.questionId,
    );
    if (options.length < 2) {
      throw new ValidationError([], "Question needs at least two options");
    }
    if (!options.some((option) => option.isCorrect)) {
      throw new ValidationError(
        [],
        "Mark a correct option before starting this question",
      );
    }

    const duration =
      input.durationSeconds ??
      poll.questionDurationSec ??
      DEFAULT_QUIZ_DURATION_SECONDS;
    const endsAt = new Date(Date.now() + duration * 1000);

    const updated = await this.pollRepository.updatePoll(pollId, {
      quizStatus: "question_open",
      currentQuestionId: input.questionId,
      questionEndsAt: endsAt,
      questionDurationSec: duration,
      status: "open",
    });

    if (!updated) {
      throw new NotFoundError("Poll not found");
    }

    this.pollRealtime.pollUpdated(updated);
    this.pollRealtime.quizQuestionOpened(updated);

    return this.getState(pollId, actor);
  }

  async closeQuestion(
    pollId: string,
    actor: { id: string; role: string },
  ): Promise<QuizState> {
    let poll = await this.pollRepository.findById(pollId);
    if (!poll) {
      throw new NotFoundError("Poll not found");
    }
    this.assertQuiz(poll);
    await this.assertOwned(poll, actor);
    poll = await this.syncExpiredQuestion(poll);

    if (poll.quizStatus !== "question_open" && poll.quizStatus !== "question_closed") {
      throw new ValidationError([], "No active question to close");
    }

    const updated = await this.pollRepository.updatePoll(pollId, {
      quizStatus: "question_closed",
      questionEndsAt: poll.questionEndsAt ?? new Date(),
    });

    if (!updated) {
      throw new NotFoundError("Poll not found");
    }

    this.pollRealtime.pollUpdated(updated);
    this.pollRealtime.quizQuestionClosed(updated);

    return this.getState(pollId, actor);
  }

  async finish(
    pollId: string,
    actor: { id: string; role: string },
  ): Promise<QuizState> {
    const poll = await this.pollRepository.findById(pollId);
    if (!poll) {
      throw new NotFoundError("Poll not found");
    }
    this.assertQuiz(poll);
    await this.assertOwned(poll, actor);

    const updated = await this.pollRepository.updatePoll(pollId, {
      quizStatus: "finished",
      questionEndsAt: null,
    });

    if (!updated) {
      throw new NotFoundError("Poll not found");
    }

    this.pollRealtime.pollUpdated(updated);
    this.pollRealtime.quizFinished(updated);

    return this.getState(pollId, actor);
  }

  async resetToLobby(
    pollId: string,
    actor: { id: string; role: string },
  ): Promise<QuizState> {
    const poll = await this.pollRepository.findById(pollId);
    if (!poll) {
      throw new NotFoundError("Poll not found");
    }
    this.assertQuiz(poll);
    await this.assertOwned(poll, actor);

    await this.responseRepository.deleteByPollId(pollId);

    const updated = await this.pollRepository.updatePoll(pollId, {
      quizStatus: "lobby",
      currentQuestionId: null,
      questionEndsAt: null,
      status: "open",
    });

    if (!updated) {
      throw new NotFoundError("Poll not found");
    }

    this.pollRealtime.pollUpdated(updated);

    return this.getState(pollId, actor);
  }

  async submitAnswer(
    pollId: string,
    userId: string | undefined,
    input: SubmitQuizAnswerInput,
  ): Promise<{ correct: boolean | null }> {
    if (!userId) {
      throw new UnauthorizedError("Sign in to answer this quiz");
    }

    let poll = await this.pollRepository.findById(pollId);
    if (!poll) {
      throw new NotFoundError("Poll not found");
    }
    this.assertQuiz(poll);
    poll = await this.syncExpiredQuestion(poll);

    if (poll.requireAuthentication && !userId) {
      throw new UnauthorizedError("Sign in to answer this quiz");
    }

    if (poll.quizStatus !== "question_open") {
      throw new ValidationError([], "No question is open for answers");
    }

    if (poll.currentQuestionId !== input.questionId) {
      throw new ValidationError([], "That question is not active");
    }

    if (poll.questionEndsAt && poll.questionEndsAt <= new Date()) {
      throw new ValidationError([], "Time is up for this question");
    }

    const option = await this.optionRepository.findById(
      input.optionId,
      input.questionId,
    );
    if (!option) {
      throw new NotFoundError("Option not found");
    }

    let response = await this.responseRepository.findByPollAndUser(
      pollId,
      userId,
    );

    try {
      if (!response) {
        const created = await this.responseRepository.createResponseWithAnswers(
          { pollId, userId, guestId: null },
          [{ questionId: input.questionId, optionId: input.optionId }],
        );
        response = created.response;
      } else {
        const existing = await this.responseRepository.findAnswerForQuestion(
          response.id,
          input.questionId,
        );
        if (existing) {
          throw new ConflictError("You already answered this question");
        }
        await this.responseRepository.addAnswer(response.id, {
          questionId: input.questionId,
          optionId: input.optionId,
        });
      }
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      if (isUniqueViolation(error)) {
        throw new ConflictError("You already answered this question");
      }
      throw error;
    }

    const totalResponses =
      await this.quizRepository.countAnswersForQuestion(
        pollId,
        input.questionId,
      );
    this.pollRealtime.responseSubmitted(pollId, totalResponses);
    this.pollRealtime.quizAnswerReceived(pollId, {
      questionId: input.questionId,
      totalAnswers: totalResponses,
    });

    // Don't reveal correctness until question closes
    return { correct: null };
  }

  async getLeaderboard(
    pollId: string,
    actor: { id: string; role: string },
  ): Promise<QuizState["leaderboard"]> {
    const poll = await this.pollRepository.findById(pollId);
    if (!poll) {
      throw new NotFoundError("Poll not found");
    }
    this.assertQuiz(poll);

    const isOwner = poll.creatorId === actor.id || actor.role === "admin";
    if (
      !isOwner &&
      poll.quizStatus !== "question_closed" &&
      poll.quizStatus !== "finished"
    ) {
      throw new ForbiddenError("Leaderboard is not available yet");
    }

    return this.quizRepository.getLeaderboard(pollId);
  }
}
