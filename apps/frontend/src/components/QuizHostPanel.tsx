import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DEFAULT_QUIZ_DURATION_SECONDS,
  QUIZ_DURATION_SECONDS,
} from "@polling-system/shared";
import { getErrorMessage } from "@/features/auth/form-utils";
import type { Question } from "@/features/polls/poll-api";
import {
  closeQuizQuestion,
  finishQuiz,
  getQuizState,
  resetQuizLobby,
  startQuizQuestion,
  type QuizState,
} from "@/features/polls/quiz-api";
import { usePollSocket } from "@/features/polls/usePollSocket";

function useQuestionExpiry(
  endsAt: string | null,
  serverNow: string | undefined,
  active: boolean,
  onExpire: () => void,
) {
  const onExpireRef = useRef(onExpire);
  const firedRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    firedRef.current = false;
    if (!active || !endsAt || !serverNow) return;

    const skew = Date.now() - new Date(serverNow).getTime();
    const tick = () => {
      const left = new Date(endsAt).getTime() - (Date.now() - skew);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current();
      }
    };

    tick();
    const id = window.setInterval(tick, 400);
    return () => window.clearInterval(id);
  }, [active, endsAt, serverNow]);
}

function Leaderboard({ entries }: { entries: QuizState["leaderboard"] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No answers yet.</p>;
  }

  return (
    <ol className="space-y-2">
      {entries.map((entry, index) => (
        <li
          key={entry.userId}
          className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
        >
          <span>
            <span className="mr-2 text-muted-foreground">#{index + 1}</span>
            {entry.username}
          </span>
          <span className="font-semibold">
            {entry.correctCount}
            <span className="font-normal text-muted-foreground">
              /{entry.answeredCount} correct
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function QuizHostPanel({
  pollId,
  questions,
}: {
  pollId: string;
  questions: Question[];
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [duration, setDuration] = useState<number>(DEFAULT_QUIZ_DURATION_SECONDS);

  const stateQuery = useQuery({
    queryKey: ["quiz-host-state", pollId],
    queryFn: () => getQuizState(pollId),
    refetchInterval: 4_000,
  });

  const state = stateQuery.data;
  const poll = state?.poll;

  useEffect(() => {
    if (poll?.questionDurationSec) {
      setDuration(poll.questionDurationSec);
    }
  }, [poll?.questionDurationSec]);

  usePollSocket({
    pollId,
    onQuizChanged: () => {
      void queryClient.invalidateQueries({ queryKey: ["quiz-host-state", pollId] });
    },
    onPollUpdated: () => {
      void queryClient.invalidateQueries({ queryKey: ["quiz-host-state", pollId] });
    },
    onResponseSubmitted: () => {
      void queryClient.invalidateQueries({ queryKey: ["quiz-host-state", pollId] });
    },
  });

  useQuestionExpiry(
    poll?.questionEndsAt ?? null,
    state?.serverNow,
    poll?.quizStatus === "question_open",
    () => {
      void run(() => closeQuizQuestion(pollId));
    },
  );

  const nextQuestion = useMemo(() => {
    if (!poll?.currentQuestionId) {
      return questions[0] ?? null;
    }
    const index = questions.findIndex((q) => q.id === poll.currentQuestionId);
    if (index < 0) return questions[0] ?? null;
    return questions[index + 1] ?? null;
  }, [questions, poll?.currentQuestionId]);

  async function run(action: () => Promise<unknown>) {
    setPending(true);
    setError(null);
    try {
      await action();
      await queryClient.invalidateQueries({ queryKey: ["quiz-host-state", pollId] });
    } catch (err) {
      setError(getErrorMessage(err, "Quiz action failed"));
    } finally {
      setPending(false);
    }
  }

  if (stateQuery.isLoading || !poll) {
    return (
      <section className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
        Loading live quiz controls…
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Live quiz</h2>
          <p className="text-sm text-muted-foreground">
            Status:{" "}
            <span className="font-medium text-foreground">
              {poll.quizStatus?.replaceAll("_", " ") ?? "lobby"}
            </span>
          </p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Seconds per question</span>
          <select
            className="rounded-md border border-border bg-background px-2 py-1.5"
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            disabled={poll.quizStatus === "question_open" || pending}
          >
            {QUIZ_DURATION_SECONDS.map((value) => (
              <option key={value} value={value}>
                {value}s
              </option>
            ))}
          </select>
        </label>
      </div>

      {state.currentQuestion ? (
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
          Current: <strong>{state.currentQuestion.title}</strong>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {poll.quizStatus !== "question_open" &&
        poll.quizStatus !== "finished" ? (
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            disabled={pending || !nextQuestion}
            onClick={() => {
              if (!nextQuestion) return;
              void run(() =>
                startQuizQuestion(pollId, {
                  questionId: nextQuestion.id,
                  durationSeconds: duration as (typeof QUIZ_DURATION_SECONDS)[number],
                }),
              );
            }}
          >
            {poll.currentQuestionId ? "Start next question" : "Start first question"}
          </button>
        ) : null}

        {poll.quizStatus === "question_open" ? (
          <button
            type="button"
            className="rounded-md border border-border px-3 py-2 text-sm font-medium disabled:opacity-50"
            disabled={pending}
            onClick={() => void run(() => closeQuizQuestion(pollId))}
          >
            Close question now
          </button>
        ) : null}

        {poll.quizStatus !== "finished" ? (
          <button
            type="button"
            className="rounded-md border border-border px-3 py-2 text-sm font-medium disabled:opacity-50"
            disabled={pending}
            onClick={() => void run(() => finishQuiz(pollId))}
          >
            Finish quiz
          </button>
        ) : (
          <button
            type="button"
            className="rounded-md border border-border px-3 py-2 text-sm font-medium disabled:opacity-50"
            disabled={pending}
            onClick={() => {
              if (
                !window.confirm(
                  "Reset to lobby and clear all answers/scores for this quiz?",
                )
              ) {
                return;
              }
              void run(() => resetQuizLobby(pollId));
            }}
          >
            Reset to lobby
          </button>
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div>
        <h3 className="mb-2 font-display text-lg font-semibold">Leaderboard</h3>
        <Leaderboard entries={state.leaderboard} />
      </div>
    </section>
  );
}
