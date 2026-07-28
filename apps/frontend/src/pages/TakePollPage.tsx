import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { POLL_THEMES } from "@polling-system/shared";
import { LiveQuizStudent } from "@/components/LiveQuizStudent";
import { PollResultsPanel } from "@/components/PollResultsPanel";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthContext";
import { getErrorMessage } from "@/features/auth/form-utils";
import type { Poll } from "@/features/polls/poll-api";
import { getQuizStateByShareId } from "@/features/polls/quiz-api";
import {
  getPollFormByShareId,
  getPollResults,
  submitPollResponse,
  type PollResults,
} from "@/features/polls/public-poll-api";
import { usePollSocket } from "@/features/polls/usePollSocket";

type AnswersMap = Record<string, string>;

export function TakePollPage() {
  const { shareId = "" } = useParams();

  const quizProbe = useQuery({
    queryKey: ["quiz-state", shareId],
    queryFn: () => getQuizStateByShareId(shareId),
    enabled: Boolean(shareId),
    retry: false,
  });

  if (quizProbe.isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (quizProbe.data?.poll.mode === "quiz") {
    return <LiveQuizStudent shareId={shareId} />;
  }

  const probeMessage =
    quizProbe.error instanceof ApiError
      ? quizProbe.error.message
      : getErrorMessage(quizProbe.error, "");
  const isClassicPoll = /not a live quiz/i.test(probeMessage);

  if (quizProbe.isError && !isClassicPoll) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="font-display text-2xl font-semibold">
            Unable to open link
          </h1>
          <p className="text-sm text-muted-foreground">
            {probeMessage || "Something went wrong loading this poll."}
          </p>
          <Link to="/" className="text-sm text-brand underline">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  return <ClassicTakePoll shareId={shareId} />;
}

function ClassicTakePoll({ shareId }: { shareId: string }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState<AnswersMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<PollResults | null>(null);
  const [pollOverride, setPollOverride] = useState<Poll | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const formQuery = useQuery({
    queryKey: ["poll-form", shareId],
    queryFn: () => getPollFormByShareId(shareId),
    enabled: Boolean(shareId) && !authLoading,
    retry: false,
  });

  const activePoll = pollOverride ?? formQuery.data?.poll ?? null;
  const questions = formQuery.data?.questions ?? [];
  const theme = activePoll
    ? POLL_THEMES[activePoll.themeId]
    : POLL_THEMES.ocean;
  const themeStyle = useMemo(
    () => theme.cssVars as CSSProperties,
    [theme],
  );

  usePollSocket({
    pollId: activePoll?.id ?? null,
    enabled: Boolean(activePoll) && !deleted,
    onResultsUpdated: setResults,
    onResponseSubmitted: (payload) => {
      setResults((current) =>
        current
          ? { ...current, totalResponses: payload.totalResponses }
          : current,
      );
    },
    onPollUpdated: (next) => {
      setPollOverride(next);
      void queryClient.setQueryData(
        ["poll-form", shareId],
        (old: { poll: Poll; questions: unknown } | undefined) =>
          old ? { ...old, poll: next } : old,
      );
    },
    onPollDeleted: () => setDeleted(true),
  });

  useEffect(() => {
    if (!activePoll?.resultPublished || !activePoll.id) return;
    if (!submitted && activePoll.status === "open") return;

    let cancelled = false;
    void getPollResults(activePoll.id)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {
        /* unpublished or forbidden */
      });

    return () => {
      cancelled = true;
    };
  }, [activePoll?.id, activePoll?.resultPublished, activePoll?.status, submitted]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!activePoll) return;

    setFormError(null);

    const missing = questions.filter(
      (question) => question.isMandatory && !answers[question.id],
    );
    if (missing.length > 0) {
      setFormError("Please answer all required questions.");
      return;
    }

    const payloadAnswers = Object.entries(answers).map(
      ([questionId, optionId]) => ({ questionId, optionId }),
    );
    if (payloadAnswers.length === 0) {
      setFormError("Select at least one answer.");
      return;
    }

    setSubmitting(true);
    try {
      await submitPollResponse(activePoll.id, { answers: payloadAnswers });
      setSubmitted(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setSubmitted(true);
        setFormError("You have already submitted this poll.");
        return;
      }
      setFormError(getErrorMessage(error, "Unable to submit response"));
    } finally {
      setSubmitting(false);
    }
  }

  async function viewResultsOnly() {
    if (!activePoll) return;
    setFormError(null);
    try {
      const data = await getPollResults(activePoll.id);
      setResults(data);
    } catch (error) {
      setFormError(getErrorMessage(error, "Results are not available"));
    }
  }

  if (deleted) {
    return (
      <Shell style={themeStyle}>
        <h1 className="font-display text-3xl font-semibold">Poll removed</h1>
        <p className="mt-2" style={{ color: "var(--poll-muted)" }}>
          This poll is no longer available.
        </p>
        <Link to="/" className="mt-6 inline-block underline">
          Back home
        </Link>
      </Shell>
    );
  }

  if (authLoading || formQuery.isLoading) {
    return (
      <Shell style={themeStyle}>
        <div className="space-y-4 animate-pulse">
          <div
            className="h-4 w-24 rounded"
            style={{ background: "var(--poll-muted)", opacity: 0.35 }}
          />
          <div
            className="h-10 w-3/4 max-w-md rounded"
            style={{ background: "var(--poll-muted)", opacity: 0.35 }}
          />
          <div
            className="h-24 w-full rounded-xl"
            style={{ background: "var(--poll-muted)", opacity: 0.2 }}
          />
          <div
            className="h-24 w-full rounded-xl"
            style={{ background: "var(--poll-muted)", opacity: 0.2 }}
          />
        </div>
      </Shell>
    );
  }

  if (formQuery.isError) {
    const error = formQuery.error;
    const message = getErrorMessage(error, "This poll is unavailable.");
    const lower = message.toLowerCase();
    const needsAuth =
      error instanceof ApiError &&
      (error.status === 401 || lower.includes("authentication"));
    const isExpired = lower.includes("expired");
    const isClosed = lower.includes("closed");
    const isMissing =
      (error instanceof ApiError && error.status === 404) ||
      lower.includes("not found");

    const title = needsAuth
      ? "Sign in required"
      : isExpired
        ? "This poll has expired"
        : isClosed
          ? "This poll is closed"
          : isMissing
            ? "Poll not found"
            : "Unable to open poll";

    const detail = needsAuth
      ? "The creator requires a signed-in account to vote."
      : isExpired
        ? "The response window has ended. You can no longer submit answers."
        : isClosed
          ? "The creator closed this poll. New responses are not accepted."
          : message;

    return (
      <Shell style={themeStyle}>
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        <p className="mt-2" style={{ color: "var(--poll-muted)" }}>
          {detail}
        </p>
        {needsAuth && !isAuthenticated ? (
          <Link
            to={`/login?next=${encodeURIComponent(`/p/${shareId}`)}`}
            className="mt-6 inline-flex rounded-md px-4 py-2.5 font-semibold"
            style={{
              background: "var(--poll-accent)",
              color: "var(--poll-accent-text)",
            }}
          >
            Sign in to continue
          </Link>
        ) : (
          <Link to="/" className="mt-6 inline-block underline">
            Back home
          </Link>
        )}
      </Shell>
    );
  }

  if (!activePoll) {
    return null;
  }

  const isExpired =
    Boolean(activePoll.expireAt) &&
    new Date(activePoll.expireAt as string).getTime() <= Date.now();
  const isClosed = activePoll.status !== "open" || isExpired;
  const showForm = !submitted && !isClosed;
  const showResults = Boolean(results && activePoll.resultPublished);

  return (
    <Shell style={themeStyle}>
      <header className="space-y-3">
        <p
          className="text-sm font-medium uppercase tracking-wide"
          style={{ color: "var(--poll-muted)" }}
        >
          Ballotly
        </p>
        <h1
          className="font-display text-4xl font-semibold tracking-tight"
          style={{ color: "var(--poll-text)" }}
        >
          {activePoll.title}
        </h1>
        {activePoll.description ? (
          <p className="text-base" style={{ color: "var(--poll-muted)" }}>
            {activePoll.description}
          </p>
        ) : null}
        {isClosed ? (
          <div
            className="rounded-lg border px-3 py-2 text-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--poll-muted) 35%, transparent)",
              color: "var(--poll-muted)",
            }}
          >
            {isExpired
              ? "This poll has expired. Voting is closed."
              : "This poll is closed. Voting is no longer available."}
          </div>
        ) : null}
      </header>

      {showForm ? (
        <form
          className="mt-10 space-y-8"
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
        >
          {questions.map((question, index) => (
            <fieldset key={question.id} className="space-y-3">
              <legend
                className="font-display text-lg font-semibold"
                style={{ color: "var(--poll-text)" }}
              >
                {index + 1}. {question.title}
                {question.isMandatory ? (
                  <span className="ml-1" style={{ color: "var(--poll-accent)" }}>
                    *
                  </span>
                ) : (
                  <span
                    className="ml-2 text-sm font-normal"
                    style={{ color: "var(--poll-muted)" }}
                  >
                    Optional
                  </span>
                )}
              </legend>
              <div className="space-y-2">
                {question.options.map((option) => {
                  const selected = answers[question.id] === option.id;
                  return (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
                      style={{
                        borderColor: selected
                          ? "var(--poll-accent)"
                          : "var(--poll-border)",
                        background: selected
                          ? "color-mix(in srgb, var(--poll-accent) 12%, var(--poll-surface))"
                          : "var(--poll-surface)",
                        color: "var(--poll-text)",
                      }}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.id}
                        checked={selected}
                        onChange={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: option.id,
                          }))
                        }
                      />
                      <span>{option.value}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {formError ? (
            <p className="text-sm" style={{ color: "#c62828" }} role="alert">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || questions.length === 0}
            className="rounded-md px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: "var(--poll-accent)",
              color: "var(--poll-accent-text)",
            }}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </form>
      ) : null}

      {submitted ? (
        <div
          className="mt-10 space-y-2 rounded-xl border p-5"
          style={{
            borderColor: "var(--poll-border)",
            background: "var(--poll-surface)",
          }}
        >
          <h2
            className="font-display text-xl font-semibold"
            style={{ color: "var(--poll-text)" }}
          >
            Thanks for voting
          </h2>
          <p style={{ color: "var(--poll-muted)" }}>
            {activePoll.resultPublished
              ? "Results update live as others respond."
              : "The creator has not published results yet."}
          </p>
          {formError ? (
            <p className="text-sm" style={{ color: "#c62828" }} role="alert">
              {formError}
            </p>
          ) : null}
        </div>
      ) : null}

      {showResults && results ? (
        <div
          className="mt-10 rounded-xl border p-5"
          style={{
            borderColor: "var(--poll-border)",
            background: "var(--poll-surface)",
          }}
        >
          <PollResultsPanel results={results} live />
        </div>
      ) : null}

      {!submitted && !isClosed && activePoll.resultPublished && !results ? (
        <button
          type="button"
          className="mt-8 text-sm underline"
          style={{ color: "var(--poll-muted)" }}
          onClick={() => void viewResultsOnly()}
        >
          View live results without voting
        </button>
      ) : null}
    </Shell>
  );
}

function Shell({
  children,
  style,
}: {
  children: ReactNode;
  style: CSSProperties;
}) {
  return (
    <div
      className="min-h-screen px-6 py-12 transition-colors duration-500"
      style={{
        ...style,
        background: "var(--poll-bg)",
        color: "var(--poll-text)",
      }}
    >
      <div className="mx-auto max-w-xl animate-[fadeIn_0.45s_ease-out]">
        {children}
      </div>
    </div>
  );
}
