import { ConflictError } from "../../errors/conflict.error";
import { NotFoundError } from "../../errors/not-found.error";
import { UnauthorizedError } from "../../errors/unauthorized.error";
import { ValidationError } from "../../errors/validation.error";
import type { PollRealtime } from "../../infrastructure/socket/poll-realtime";
import type { OptionRepository } from "../options/option.repository";
import type { PollRepository } from "../polls/poll.repository";
import type { PublicPoll } from "../polls/poll.types";
import type { QuestionRepository } from "../questions/question.repository";
import type { ResultService } from "../results/result.service";
import type { ResponseRepository } from "./response.repository";
import type { SubmitResponseInput } from "./response.schema";
import type {
  CreateAnswerData,
  PublicAnswer,
  PublicResponse,
} from "./response.types";

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export class ResponseService {
  constructor(
    private readonly repository: ResponseRepository,
    private readonly pollRepository: PollRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly optionRepository: OptionRepository,
    private readonly pollRealtime: PollRealtime,
    private readonly resultService: ResultService,
  ) {}

  private async assertPollAcceptsResponse(pollId: string) {
    const poll = await this.pollRepository.findById(pollId);

    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    if (poll.status !== "open") {
      throw new ValidationError([], "Poll is closed");
    }

    if (poll.expireAt && poll.expireAt <= new Date()) {
      throw new ValidationError([], "Poll is expired");
    }

    return poll;
  }

  private async resolveIdentity(
    poll: PublicPoll,
    userId: string | undefined,
    guestId: string | undefined,
  ) {
    if (poll.requireAuthentication && !userId) {
      throw new UnauthorizedError("Authentication required for this poll");
    }
    if (userId) {
      return { userId, guestId: null };
    }

    if (!guestId) {
      throw new ValidationError([], "Guest session is required");
    }

    return { userId: null, guestId };
  }

  private async assertMandatoryQuestionsAnswered(
    pollId: string,
    answers: CreateAnswerData[],
  ): Promise<void> {
    const questions = await this.questionRepository.findByPollId(pollId);
    const submittedQuestionIds = new Set(
      answers.map((answer) => answer.questionId),
    );
    for (const question of questions) {
      if (question.isMandatory && !submittedQuestionIds.has(question.id)) {
        throw new ValidationError(
          [],
          "All mandatory questions must be answered",
        );
      }
    }
  }

  private async validateAnswers(pollId: string, answers: CreateAnswerData[]) {
    await this.assertMandatoryQuestionsAnswered(pollId, answers);
    const seenQuestionIds = new Set<string>();

    for (const answer of answers) {
      if (seenQuestionIds.has(answer.questionId)) {
        throw new ValidationError([], "Duplicate answer for the same question");
      }
      seenQuestionIds.add(answer.questionId);

      const question = await this.questionRepository.findById(
        answer.questionId,
        pollId,
      );

      if (!question) {
        throw new NotFoundError("Question not found");
      }

      const option = await this.optionRepository.findById(
        answer.optionId,
        answer.questionId,
      );

      if (!option) {
        throw new NotFoundError("Option not found");
      }
    }
  }

  private async publishRealtimeUpdates(
    pollId: string,
    resultPublished: boolean,
  ): Promise<void> {
    const totalResponses = await this.resultService.getTotalResponses(pollId);
    this.pollRealtime.responseSubmitted(pollId, totalResponses);

    if (resultPublished) {
      const results = await this.resultService.buildPollResults(pollId);
      this.pollRealtime.resultsUpdated(results);
    }
  }

  async submitResponse(
    pollId: string,
    userId: string | undefined,
    guestId: string | undefined,
    input: SubmitResponseInput,
  ): Promise<{ response: PublicResponse; answers: PublicAnswer[] }> {
    const poll = await this.assertPollAcceptsResponse(pollId);
    const identity = await this.resolveIdentity(poll, userId, guestId);

    await this.validateAnswers(pollId, input.answers);

    try {
      const saved = await this.repository.createResponseWithAnswers(
        { pollId, ...identity },
        input.answers,
      );

      await this.publishRealtimeUpdates(pollId, poll.resultPublished);

      return saved;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("You have already submitted this poll");
      }
      throw error;
    }
  }

  async getById(
    id: string,
    pollId: string,
  ): Promise<{ response: PublicResponse; answers: PublicAnswer[] }> {
    const response = await this.repository.findById(id, pollId);

    if (!response) {
      throw new NotFoundError("Response not found");
    }

    const answers = await this.repository.findAnswersByResponseId(response.id);

    return { response, answers };
  }
}
