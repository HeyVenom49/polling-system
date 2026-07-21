import { ForbiddenError } from "../../errors/forbidden.error";
import { NotFoundError } from "../../errors/not-found.error";
import type { OptionRepository } from "../options/option.repository";
import type { PollRepository } from "../polls/poll.repository";
import type { QuestionRepository } from "../questions/question.repository";
import type { ResultRepository } from "./result.repository";
import type {
  OptionResult,
  PollAnalytics,
  PollResults,
  QuestionResult,
} from "./result.types";

function isAdminRole(role: string | undefined): boolean {
  return role === "admin";
}

export class ResultService {
  constructor(
    private readonly repository: ResultRepository,
    private readonly pollRepository: PollRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly optionRepository: OptionRepository,
  ) {}

  private toPercentage(count: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  private buildQuestionResult(
    question: { id: string; title: string; displayOrder: number },
    options: {
      id: string;
      value: string;
      displayOrder: number;
    }[],
    countByOptionId: Map<string, number>,
  ): QuestionResult {
    const optionResults: OptionResult[] = options.map((option) => {
      const optionCount = countByOptionId.get(option.id) ?? 0;
      return {
        id: option.id,
        value: option.value,
        displayOrder: option.displayOrder,
        count: optionCount,
        percentage: 0,
      };
    });

    const totalAnswers = optionResults.reduce(
      (sum, option) => sum + option.count,
      0,
    );

    return {
      id: question.id,
      title: question.title,
      displayOrder: question.displayOrder,
      totalAnswers,
      options: optionResults.map((option) => ({
        ...option,
        percentage: this.toPercentage(option.count, totalAnswers),
      })),
    };
  }

  /** Aggregation only — safe for internal/socket use (no ACL). */
  async buildPollResults(pollId: string): Promise<PollResults> {
    const [totalResponses, answerCounts, questions, options] =
      await Promise.all([
        this.repository.countResponsesByPollId(pollId),
        this.repository.countAnswersByOptionForPoll(pollId),
        this.questionRepository.findByPollId(pollId),
        this.optionRepository.findByPollId(pollId),
      ]);

    const countByOptionId = new Map(
      answerCounts.map((row) => [row.optionId, row.count]),
    );

    const optionsByQuestionId = new Map<string, typeof options>();

    for (const option of options) {
      const list = optionsByQuestionId.get(option.questionId) ?? [];
      list.push(option);
      optionsByQuestionId.set(option.questionId, list);
    }

    const questionResults = questions.map((question) =>
      this.buildQuestionResult(
        question,
        optionsByQuestionId.get(question.id) ?? [],
        countByOptionId,
      ),
    );

    return {
      pollId,
      totalResponses,
      questions: questionResults,
    };
  }

  async getTotalResponses(pollId: string): Promise<number> {
    return this.repository.countResponsesByPollId(pollId);
  }

  async getPollResults(
    pollId: string,
    viewerId?: string,
    viewerRole?: string,
  ): Promise<PollResults> {
    const poll = await this.pollRepository.findById(pollId);

    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    const isCreator = viewerId !== undefined && poll.creatorId === viewerId;

    if (!isCreator && !isAdminRole(viewerRole) && !poll.resultPublished) {
      throw new ForbiddenError("Poll results are not published");
    }

    return this.buildPollResults(pollId);
  }

  async getPollAnalytics(
    pollId: string,
    viewerId: string,
    viewerRole: string,
  ): Promise<PollAnalytics> {
    const poll = await this.pollRepository.findById(pollId);

    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    const isCreator = poll.creatorId === viewerId;

    if (!isCreator && !isAdminRole(viewerRole)) {
      throw new ForbiddenError("Only the poll owner or an admin can view analytics");
    }

    const [
      totalResponses,
      guestResponses,
      authenticatedResponses,
      responsesByDay,
      latest,
      results,
    ] = await Promise.all([
      this.repository.countResponsesByPollId(pollId),
      this.repository.countGuestResponsesByPollId(pollId),
      this.repository.countAuthenticatedResponsesByPollId(pollId),
      this.repository.countResponsesByDay(pollId),
      this.repository.findLatestResponses(pollId, 20),
      this.buildPollResults(pollId),
    ]);

    return {
      pollId,
      totalResponses,
      guestResponses,
      authenticatedResponses,
      responsesByDay,
      recentResponses: latest.map((row) => ({
        id: row.id,
        identityType: row.userId ? "user" : "guest",
        submittedAt: row.submittedAt,
      })),
      results,
    };
  }
}
