import { ForbiddenError } from "../../errors/forbidden.error";
import { NotFoundError } from "../../errors/not-found.error";
import type { OptionRepository } from "../options/option.repository";
import type { PollRepository } from "../polls/poll.repository";
import type { QuestionRepository } from "../questions/question.repository";
import type { ResultRepository } from "./result.repository";
import type { OptionResult, PollResults, QuestionResult } from "./result.types";

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

  private async buildQuestionResult(
    question: { id: string; title: string; displayOrder: number },
    countByOptionId: Map<string, number>,
  ): Promise<QuestionResult> {
    const options = await this.optionRepository.findByQuestionId(question.id);

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

  async getPollResults(
    pollId: string,
    viewerId?: string,
  ): Promise<PollResults> {
    const poll = await this.pollRepository.findById(pollId);

    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    const isCreator = viewerId !== undefined && poll.creatorId === viewerId;

    if (!isCreator && !poll.resultPublished) {
      throw new ForbiddenError("Poll results are not published");
    }

    const totalResponses = await this.repository.countResponsesByPollId(pollId);
    const answerCounts =
      await this.repository.countAnswersByOptionForPoll(pollId);

    const countByOptionId = new Map(
      answerCounts.map((row) => [row.optionId, row.count]),
    );

    const questions = await this.questionRepository.findByPollId(pollId);

    const questionResults: QuestionResult[] = [];

    for (const question of questions) {
      questionResults.push(
        await this.buildQuestionResult(question, countByOptionId),
      );
    }

    return {
      pollId,
      totalResponses,
      questions: questionResults,
    };
  }
}
