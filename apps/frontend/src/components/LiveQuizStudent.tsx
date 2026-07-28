import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { POLL_THEMES } from "@polling-system/shared";
import { useAuth } from "@/features/auth/AuthContext";
import { getErrorMessage } from "@/features/auth/form-utils";
import { usePollSocket } from "@/features/polls/usePollSocket";
import {
  getQuizStateByShareId,
  submitQuizAnswer,
  type QuizState,
} from "@/features/polls/quiz-api";

function useCountdown(
  endsAt: string | null,
  serverNow: string,
  onExpire?: () => void,
) {
  const skew = useMemo(
    () => Date.now() - new Date(serverNow).getTime(),
    [serverNow],
  );
  const [remaining, setRemaining] = useState(0);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    expiredRef.current = false;
    if (!endsAt) {
      setRemaining(0);
      return;
    }

    const tick = () => {
      const left = Math.max(
        0,
        Math.ceil((new Date(endsAt).getTime() - (Date.now() - skew)) / 1000),
      );
      setRemaining(left);
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endsAt, skew]);

  return remaining;
}

function Leaderboard({
  entries,
}: {
  entries: QuizState["leaderboard"];
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">No scores yet.</p>
    );
  }

  return (
    <ol className="space-y-2">
      {entries.map((entry, index) => (
        <li
          key={entry.userId}
          className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
        >
          <span>
            <span className="mr-2 text-[var(--color-muted)]">#{index + 1}</span>
            {entry.username}
          </span>
          <span className="font-semibold">
            {entry.correctCount}
            <span className="font-normal text-[var(--color-muted)]">
              /{entry.answeredCount}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function LiveQuizStudent({ shareId }: { shareId: string }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stateQuery = useQuery({
    queryKey: ["quiz-state", shareId],
    queryFn: () => getQuizStateByShareId(shareId),
    enabled: Boolean(shareId) && !authLoading,
    refetchInterval: 5_000,
  });

  const state = stateQuery.data;
  const poll = state?.poll;
  const theme = poll ? POLL_THEMES[poll.themeId] : POLL_THEMES.ocean;

  const refreshState = () => {
    void queryClient.invalidateQueries({ queryKey: ["quiz-state", shareId] });
  };

  const remaining = useCountdown(
    poll?.quizStatus === "question_open" ? (poll.questionEndsAt ?? null) : null,
    state?.serverNow ?? new Date().toISOString(),
    () => {
      refreshState();
    },
  );

  usePollSocket({
    pollId: poll?.id ?? null,
    enabled: Boolean(poll?.id),
    onQuizChanged: refreshState,
    onPollUpdated: refreshState,
  });

  useEffect(() => {
    setSelectedOptionId(null);
    setError(null);
  }, [poll?.currentQuestionId, poll?.quizStatus]);

  async function handleAnswer(optionId: string) {
    if (!poll || !state?.currentQuestion) return;
    setSubmitting(true);
    setError(null);
    setSelectedOptionId(optionId);
    try {
      await submitQuizAnswer(poll.id, {
        questionId: state.currentQuestion.id,
        optionId,
      });
      await queryClient.invalidateQueries({ queryKey: ["quiz-state", shareId] });
    } catch (err) {
      setError(getErrorMessage(err, "Could not submit answer"));
      setSelectedOptionId(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || stateQuery.isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center text-[var(--color-muted)]">
        Loading quiz…
      </div>
    );
  }

  if (stateQuery.isError || !state || !poll) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="font-display text-2xl font-semibold">Quiz unavailable</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {getErrorMessage(stateQuery.error, "Could not load this quiz.")}
          </p>
          <Link to="/" className="text-sm text-brand underline">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="grid min-h-dvh place-items-center px-6"
        style={theme.cssVars as CSSProperties}
      >
        <div className="max-w-md space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <h1 className="font-display text-3xl font-semibold">{poll.title}</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Sign in to join this live quiz. One account, one answer per question.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to={`/login?next=/p/${shareId}`}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
            <Link
              to={`/register?next=/p/${shareId}`}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const answeredCurrent =
    Boolean(state.currentQuestion) &&
    state.myAnsweredQuestionIds.includes(state.currentQuestion!.id);

  return (
    <div
      className="min-h-dvh px-6 py-10"
      style={theme.cssVars as CSSProperties}
    >
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Live quiz · {poll.quizStatus?.replaceAll("_", " ") ?? "lobby"}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            {poll.title}
          </h1>
        </div>

        {poll.quizStatus === "lobby" ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <p className="font-display text-xl font-semibold">Waiting for host…</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Stay on this page. The next question will appear here automatically.
            </p>
          </div>
        ) : null}

        {poll.quizStatus === "question_open" && state.currentQuestion ? (
          <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold">
                {state.currentQuestion.title}
              </h2>
              <span className="shrink-0 rounded-full bg-[var(--color-primary)] px-3 py-1 text-sm font-semibold text-white">
                {remaining}s
              </span>
            </div>

            {answeredCurrent ? (
              <p className="text-sm text-[var(--color-muted)]">
                Answer locked in. Waiting for time to run out or the host to
                close this question…
              </p>
            ) : remaining <= 0 ? (
              <p className="text-sm text-[var(--color-muted)]">
                Time’s up — locking answers…
              </p>
            ) : (
              <div className="grid gap-2">
                {state.currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={submitting || remaining <= 0}
                    onClick={() => void handleAnswer(option.id)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition disabled:opacity-50 ${
                      selectedOptionId === option.id
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                        : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
                    }`}
                  >
                    {option.value}
                  </button>
                ))}
              </div>
            )}
            {error ? (
              <p className="text-sm text-[var(--color-danger)]">{error}</p>
            ) : null}
          </div>
        ) : null}

        {poll.quizStatus === "question_closed" && state.currentQuestion ? (
          <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="font-display text-2xl font-semibold">
              {state.currentQuestion.title}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">Question closed.</p>
            <ul className="space-y-2">
              {state.currentQuestion.options.map((option) => (
                <li
                  key={option.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    option.isCorrect
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-[var(--color-border)]"
                  }`}
                >
                  {option.value}
                  {option.isCorrect ? " · correct" : ""}
                </li>
              ))}
            </ul>
            <div>
              <h3 className="mb-2 font-display text-lg font-semibold">
                Leaderboard
              </h3>
              <Leaderboard entries={state.leaderboard} />
            </div>
          </div>
        ) : null}

        {poll.quizStatus === "finished" ? (
          <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="font-display text-2xl font-semibold">Quiz finished</h2>
            <Leaderboard entries={state.leaderboard} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
