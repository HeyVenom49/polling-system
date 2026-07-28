import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  canRequirePollAuthentication,
  canUsePollExpiry,
  type PollThemeId,
  type UpdatePollInput,
} from "@polling-system/shared";
import {
  Field,
  inputClassName,
  textareaClassName,
  primaryButtonClassName,
} from "@/components/Field";
import { CreatorInsights } from "@/components/CreatorInsights";
import { QuizHostPanel } from "@/components/QuizHostPanel";
import { ShareQr } from "@/components/ShareQr";
import { ProFeatureGate, ThemePicker } from "@/components/ThemePicker";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/AuthContext";
import { getErrorMessage } from "@/features/auth/form-utils";
import {
  createOption,
  createQuestion,
  deleteOption,
  deletePoll,
  deleteQuestion,
  getPoll,
  listOptions,
  listQuestions,
  reorderQuestions,
  sharePollUrl,
  updateOption,
  updatePoll,
  updateQuestion,
  type Option,
  type Poll,
  type Question,
} from "@/features/polls/poll-api";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/datetime";

type PollMetaForm = {
  title: string;
  description: string;
  requireAuthentication: boolean;
  themeId: PollThemeId;
  status: "open" | "closed";
  resultPublished: boolean;
  expireAt: string;
};

export function PollManagePage() {
  const { pollId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pageError, setPageError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const pollQuery = useQuery({
    queryKey: ["poll", pollId],
    queryFn: () => getPoll(pollId),
    enabled: Boolean(pollId),
  });

  const questionsQuery = useQuery({
    queryKey: ["poll", pollId, "questions"],
    queryFn: () => listQuestions(pollId),
    enabled: Boolean(pollId),
  });

  async function invalidatePoll() {
    await queryClient.invalidateQueries({ queryKey: ["poll", pollId] });
    await queryClient.invalidateQueries({ queryKey: ["polls", "mine"] });
  }

  async function invalidateQuestions() {
    await queryClient.invalidateQueries({
      queryKey: ["poll", pollId, "questions"],
    });
  }

  const deletePollMutation = useMutation({
    mutationFn: () => deletePoll(pollId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["polls", "mine"] });
    },
  });

  async function copyShareLink(poll: Poll) {
    try {
      await navigator.clipboard.writeText(sharePollUrl(poll.shareId));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setPageError(getErrorMessage(error, "Could not copy link"));
    }
  }

  async function moveQuestion(questionId: string, direction: -1 | 1) {
    const list = questionsQuery.data ?? [];
    const index = list.findIndex((question) => question.id === questionId);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= list.length) return;

    const orderedIds = list.map((question) => question.id);
    const current = orderedIds[index];
    const swap = orderedIds[swapIndex];
    if (!current || !swap) return;
    orderedIds[index] = swap;
    orderedIds[swapIndex] = current;

    setPageError(null);
    try {
      await reorderQuestions(pollId, orderedIds);
      await invalidateQuestions();
    } catch (error) {
      setPageError(getErrorMessage(error, "Could not reorder questions"));
    }
  }

  if (pollQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  if (pollQuery.isError || !pollQuery.data) {
    return (
      <div className="space-y-3 rounded-xl border border-dashed border-border px-6 py-10">
        <p className="font-display text-xl font-semibold">Poll not found</p>
        <p className="text-sm text-muted-foreground" role="alert">
          {getErrorMessage(pollQuery.error, "This poll may have been deleted.")}
        </p>
        <Link to="/app" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const poll = pollQuery.data;
  const shareUrl = sharePollUrl(poll.shareId);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/app"
            className="text-sm text-[var(--color-muted)] hover:underline"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold">
            {poll.mode === "quiz" ? "Manage live quiz" : "Manage poll"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{poll.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm"
            onClick={() => void copyShareLink(poll)}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white"
          >
            {poll.mode === "quiz" ? "Open user view" : "Open form"}
          </a>
        </div>
      </div>

      {pageError ? (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {pageError}
        </p>
      ) : null}

      <section className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-card/90 p-5">
        <ShareQr url={shareUrl} />
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="font-display text-lg font-semibold">Share</h2>
          <p className="text-sm text-muted-foreground">
            {poll.mode === "quiz"
              ? "Project the QR so users can join the lobby, then start questions from the live controls below."
              : "Scan the QR or copy the link so people can vote on any device."}
          </p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {shareUrl}
          </p>
        </div>
      </section>

      <PollMetaSection
        poll={poll}
        onSaved={() => void invalidatePoll()}
        onError={setPageError}
      />

      {poll.mode === "quiz" ? (
        <QuizHostPanel
          pollId={pollId}
          questions={questionsQuery.data ?? []}
        />
      ) : (
        <CreatorInsights poll={poll} />
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold">Questions</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {poll.mode === "quiz"
                ? "Add questions, mark the correct option on each, then start the live session."
                : "Add questions and at least two options each before sharing. Use up/down to reorder."}
            </p>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground opacity-70"
            title="Coming soon"
          >
            Generate with AI
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              Coming soon
            </span>
          </button>
        </div>

        <AddQuestionForm
          pollId={pollId}
          nextOrder={questionsQuery.data?.length ?? 0}
          onCreated={() => void invalidateQuestions()}
          onError={setPageError}
        />

        {questionsQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : null}

        {questionsQuery.isError ? (
          <p className="text-[var(--color-danger)]" role="alert">
            {getErrorMessage(questionsQuery.error, "Failed to load questions")}
          </p>
        ) : null}

        {questionsQuery.data && questionsQuery.data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            No questions yet. Add your first question above.
          </div>
        ) : null}

        <ul className="space-y-4">
          {questionsQuery.data?.map((question, index) => (
            <QuestionCard
              key={question.id}
              pollId={pollId}
              question={question}
              index={index}
              total={questionsQuery.data.length}
              isQuiz={poll.mode === "quiz"}
              onMove={(direction) => void moveQuestion(question.id, direction)}
              onChanged={() => void invalidateQuestions()}
              onError={setPageError}
            />
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--color-danger)]/30 bg-card/70 p-5">
        <h2 className="font-display text-lg font-semibold text-[var(--color-danger)]">
          Danger zone
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Deleting a poll removes questions, options, and responses.
        </p>
        <button
          type="button"
          className="mt-4 rounded-md border border-[var(--color-danger)] px-3 py-1.5 text-sm text-[var(--color-danger)] disabled:opacity-50"
          disabled={deletePollMutation.isPending}
          onClick={() => {
            if (
              !window.confirm(
                `Delete “${poll.title}”? This cannot be undone.`,
              )
            ) {
              return;
            }
            setPageError(null);
            deletePollMutation.mutate(undefined, {
              onSuccess: () => {
                void navigate("/app", { replace: true });
              },
              onError: (error) =>
                setPageError(getErrorMessage(error, "Could not delete poll")),
            });
          }}
        >
          {deletePollMutation.isPending ? "Deleting…" : "Delete poll"}
        </button>
      </section>
    </div>
  );
}

function PollMetaSection({
  poll,
  onSaved,
  onError,
}: {
  poll: Poll;
  onSaved: () => void;
  onError: (message: string | null) => void;
}) {
  const { user } = useAuth();
  const plan = user?.plan;
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, isDirty },
  } = useForm<PollMetaForm>({
    values: {
      title: poll.title,
      description: poll.description ?? "",
      requireAuthentication: poll.requireAuthentication,
      themeId: poll.themeId,
      status: poll.status,
      resultPublished: poll.resultPublished,
      expireAt: toDatetimeLocalValue(poll.expireAt),
    },
  });

  const themeId = watch("themeId");

  async function onSubmit(values: PollMetaForm) {
    onError(null);
    setSaveMessage(null);

    const expireAt = canUsePollExpiry(plan)
      ? fromDatetimeLocalValue(values.expireAt)
      : poll.expireAt
        ? new Date(poll.expireAt)
        : null;

    const requireAuthentication =
      poll.mode === "quiz"
        ? true
        : canRequirePollAuthentication(plan)
          ? values.requireAuthentication
          : poll.requireAuthentication;

    const input: UpdatePollInput = {
      title: values.title,
      description: values.description.trim() || null,
      requireAuthentication,
      themeId: values.themeId,
      status: values.status,
      resultPublished: values.resultPublished,
      expireAt: canUsePollExpiry(plan) ? expireAt : undefined,
    };

    try {
      await updatePoll(poll.id, input);
      setSaveMessage("Saved");
      onSaved();
    } catch (error) {
      onError(getErrorMessage(error, "Could not save poll"));
    }
  }

  return (
    <form
      className="space-y-4 rounded-xl border border-[var(--color-border)] bg-card/90 p-5"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      <h2 className="font-display text-xl font-semibold">Poll settings</h2>

      <Field id="poll-title" label="Title">
        <input
          id="poll-title"
          className={inputClassName}
          {...register("title", {
            required: true,
            minLength: 3,
            maxLength: 120,
          })}
        />
      </Field>

      <Field id="poll-description" label="Description">
        <textarea
          id="poll-description"
          rows={3}
          className={textareaClassName}
          placeholder="Optional short description for voters"
          {...register("description", { maxLength: 2000 })}
        />
      </Field>

      <ProFeatureGate plan={plan} label="Expires at">
        <input
          id="poll-expireAt"
          type="datetime-local"
          className={inputClassName}
          disabled={!canUsePollExpiry(plan)}
          {...register("expireAt")}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Clear the field and save to remove expiration.
        </p>
      </ProFeatureGate>

      <div className="flex flex-wrap gap-4 text-sm">
        {poll.mode === "quiz" ? (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-muted-foreground">
            Live quizzes always require users to sign in.
          </p>
        ) : (
          <ProFeatureGate plan={plan} label="Voter access">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                disabled={!canRequirePollAuthentication(plan)}
                {...register("requireAuthentication")}
              />
              Require sign-in to vote
            </label>
          </ProFeatureGate>
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register("resultPublished")} />
          Publish results
        </label>
        <label className="flex items-center gap-2">
          <select
            className="rounded-md border border-[var(--color-border)] px-2 py-1"
            {...register("status")}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          Status
        </label>
      </div>

      <ThemePicker
        value={themeId}
        plan={plan}
        onChange={(id) =>
          setValue("themeId", id, { shouldDirty: true, shouldTouch: true })
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className={`${primaryButtonClassName} w-auto`}
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting ? "Saving…" : "Save settings"}
        </button>
        {saveMessage ? (
          <span className="text-sm text-[var(--color-muted)]">{saveMessage}</span>
        ) : null}
      </div>
    </form>
  );
}

function AddQuestionForm({
  pollId,
  nextOrder,
  onCreated,
  onError,
}: {
  pollId: string;
  nextOrder: number;
  onCreated: () => void;
  onError: (message: string | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);
  const [pending, setPending] = useState(false);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    onError(null);
    setPending(true);
    try {
      await createQuestion(pollId, {
        title: title.trim(),
        isMandatory,
        displayOrder: nextOrder,
      });
      setTitle("");
      setIsMandatory(true);
      onCreated();
    } catch (error) {
      onError(getErrorMessage(error, "Could not add question"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-[var(--color-border)] bg-card/60 p-4"
      onSubmit={(event) => void handleAdd(event)}
    >
      <div className="min-w-[16rem] flex-1">
        <label htmlFor="new-question" className="text-sm font-medium">
          New question
        </label>
        <input
          id="new-question"
          className={`${inputClassName} mt-1`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. How satisfied are you?"
          required
          minLength={3}
          maxLength={500}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isMandatory}
          onChange={(event) => setIsMandatory(event.target.checked)}
        />
        Required
      </label>
      <button
        type="submit"
        className="rounded-md bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary)] disabled:opacity-50"
        disabled={pending || title.trim().length < 3}
      >
        {pending ? "Adding…" : "Add question"}
      </button>
    </form>
  );
}

function QuestionCard({
  pollId,
  question,
  index,
  total,
  isQuiz = false,
  onMove,
  onChanged,
  onError,
}: {
  pollId: string;
  question: Question;
  index: number;
  total: number;
  isQuiz?: boolean;
  onMove: (direction: -1 | 1) => void;
  onChanged: () => void;
  onError: (message: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(question.title);
  const [isMandatory, setIsMandatory] = useState(question.isMandatory);
  const [saving, setSaving] = useState(false);

  const optionsQuery = useQuery({
    queryKey: ["poll", pollId, "questions", question.id, "options"],
    queryFn: () => listOptions(pollId, question.id),
  });

  async function invalidateOptions() {
    await queryClient.invalidateQueries({
      queryKey: ["poll", pollId, "questions", question.id, "options"],
    });
  }

  async function saveQuestion() {
    onError(null);
    setSaving(true);
    try {
      await updateQuestion(pollId, question.id, {
        title: title.trim(),
        isMandatory,
      });
      onChanged();
    } catch (error) {
      onError(getErrorMessage(error, "Could not update question"));
    } finally {
      setSaving(false);
    }
  }

  async function removeQuestion() {
    if (!window.confirm(`Delete question “${question.title}”?`)) return;
    onError(null);
    try {
      await deleteQuestion(pollId, question.id);
      onChanged();
    } catch (error) {
      onError(getErrorMessage(error, "Could not delete question"));
    }
  }

  return (
    <li className="space-y-4 rounded-xl border border-[var(--color-border)] bg-card/90 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Question {index + 1}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="text-sm underline disabled:opacity-40"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            Move up
          </button>
          <button
            type="button"
            className="text-sm underline disabled:opacity-40"
            disabled={index >= total - 1}
            onClick={() => onMove(1)}
          >
            Move down
          </button>
          <button
            type="button"
            className="text-sm text-[var(--color-danger)] underline"
            onClick={() => void removeQuestion()}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <input
          className={inputClassName}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={500}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isMandatory}
              onChange={(event) => setIsMandatory(event.target.checked)}
            />
            Required
          </label>
          <button
            type="button"
            className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={
              saving ||
              (title.trim() === question.title &&
                isMandatory === question.isMandatory)
            }
            onClick={() => void saveQuestion()}
          >
            {saving ? "Saving…" : "Save question"}
          </button>
        </div>
      </div>

      <OptionsEditor
        pollId={pollId}
        questionId={question.id}
        options={optionsQuery.data ?? []}
        isLoading={optionsQuery.isLoading}
        isQuiz={isQuiz}
        onChanged={() => void invalidateOptions()}
        onError={onError}
      />
    </li>
  );
}

function OptionsEditor({
  pollId,
  questionId,
  options,
  isLoading,
  isQuiz = false,
  onChanged,
  onError,
}: {
  pollId: string;
  questionId: string;
  options: Option[];
  isLoading: boolean;
  isQuiz?: boolean;
  onChanged: () => void;
  onError: (message: string | null) => void;
}) {
  const [newValue, setNewValue] = useState("");
  const [pending, setPending] = useState(false);

  async function addOption(event: FormEvent) {
    event.preventDefault();
    onError(null);
    setPending(true);
    try {
      await createOption(pollId, questionId, {
        value: newValue.trim(),
        displayOrder: options.length,
        isCorrect: isQuiz && options.length === 0,
      });
      setNewValue("");
      onChanged();
    } catch (error) {
      onError(getErrorMessage(error, "Could not add option"));
    } finally {
      setPending(false);
    }
  }

  async function renameOption(option: Option, value: string) {
    const trimmed = value.trim();
    if (!trimmed || trimmed === option.value) return;
    onError(null);
    try {
      await updateOption(pollId, questionId, option.id, { value: trimmed });
      onChanged();
    } catch (error) {
      onError(getErrorMessage(error, "Could not update option"));
    }
  }

  async function markCorrect(option: Option) {
    onError(null);
    try {
      await updateOption(pollId, questionId, option.id, { isCorrect: true });
      onChanged();
    } catch (error) {
      onError(getErrorMessage(error, "Could not mark correct option"));
    }
  }

  async function removeOption(option: Option) {
    onError(null);
    try {
      await deleteOption(pollId, questionId, option.id);
      onChanged();
    } catch (error) {
      onError(getErrorMessage(error, "Could not delete option"));
    }
  }

  return (
    <div className="space-y-3 border-t border-[var(--color-border)]/70 pt-4">
      <h3 className="text-sm font-medium">
        Options{isQuiz ? " · mark the correct answer" : ""}
      </h3>
      {isLoading ? (
        <p className="text-sm text-[var(--color-muted)]">Loading options…</p>
      ) : null}
      <ul className="space-y-2">
        {options.map((option) => (
          <OptionRow
            key={option.id}
            option={option}
            isQuiz={isQuiz}
            onRename={(value) => void renameOption(option, value)}
            onMarkCorrect={() => void markCorrect(option)}
            onRemove={() => void removeOption(option)}
          />
        ))}
      </ul>
      {options.length < 2 ? (
        <p className="text-xs text-[var(--color-muted)]">
          Add at least two options so voters can choose.
        </p>
      ) : null}
      {isQuiz && options.length >= 2 && !options.some((o) => o.isCorrect) ? (
        <p className="text-xs text-[var(--color-danger)]">
          Mark one option as correct before starting this question live.
        </p>
      ) : null}
      <form className="flex flex-wrap gap-2" onSubmit={(e) => void addOption(e)}>
        <input
          className={`${inputClassName} max-w-sm flex-1`}
          value={newValue}
          onChange={(event) => setNewValue(event.target.value)}
          placeholder="New option"
          maxLength={255}
          required
        />
        <button
          type="submit"
          className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm disabled:opacity-50"
          disabled={pending || !newValue.trim()}
        >
          {pending ? "Adding…" : "Add option"}
        </button>
      </form>
    </div>
  );
}

function OptionRow({
  option,
  isQuiz,
  onRename,
  onMarkCorrect,
  onRemove,
}: {
  option: Option;
  isQuiz: boolean;
  onRename: (value: string) => void;
  onMarkCorrect: () => void;
  onRemove: () => void;
}) {
  const [value, setValue] = useState(option.value);

  return (
    <li className="flex flex-wrap items-center gap-2">
      {isQuiz ? (
        <button
          type="button"
          className={`rounded-full border px-2 py-1 text-xs ${
            option.isCorrect
              ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "border-[var(--color-border)] text-[var(--color-muted)]"
          }`}
          onClick={onMarkCorrect}
        >
          {option.isCorrect ? "Correct" : "Set correct"}
        </button>
      ) : null}
      <input
        className={`${inputClassName} max-w-sm flex-1`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => onRename(value)}
        maxLength={255}
      />
      <button
        type="button"
        className="text-sm text-[var(--color-danger)] underline"
        onClick={onRemove}
      >
        Remove
      </button>
    </li>
  );
}
