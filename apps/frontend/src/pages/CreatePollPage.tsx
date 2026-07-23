import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import {
  canRequirePollAuthentication,
  canUsePollExpiry,
  createPollSchema,
  DEFAULT_POLL_THEME_ID,
  FREE_DAILY_POLL_LIMIT,
  type CreatePollInput,
  type PollThemeId,
} from "@polling-system/shared";
import {
  Field,
  inputClassName,
  textareaClassName,
  primaryButtonClassName,
} from "@/components/Field";
import { ProFeatureGate, ThemePicker } from "@/components/ThemePicker";
import { useAuth } from "@/features/auth/AuthContext";
import { getErrorMessage } from "@/features/auth/form-utils";
import { createPoll } from "@/features/polls/poll-api";
import { fromDatetimeLocalValue } from "@/lib/datetime";

type CreatePollFormValues = {
  title: string;
  description: string;
  mode: "poll" | "quiz";
  requireAuthentication: boolean;
  themeId: PollThemeId;
  expireAt: string;
};

export function CreatePollPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<CreatePollFormValues>({
    defaultValues: {
      title: "",
      description: "",
      mode: "quiz",
      requireAuthentication: false,
      themeId: DEFAULT_POLL_THEME_ID,
      expireAt: "",
    },
  });

  const themeId = watch("themeId");
  const mode = watch("mode");
  const plan = user?.plan;

  const remaining =
    user?.dailyLimit == null
      ? null
      : Math.max(
          0,
          (user.dailyLimit ?? FREE_DAILY_POLL_LIMIT) -
            (user.pollsCreatedToday ?? 0),
        );

  async function onSubmit(values: CreatePollFormValues) {
    setFormError(null);

    const expireAt = canUsePollExpiry(plan)
      ? fromDatetimeLocalValue(values.expireAt)
      : null;
    const requireAuthentication =
      values.mode === "quiz"
        ? true
        : canRequirePollAuthentication(plan) && values.requireAuthentication;

    const parsed = createPollSchema.safeParse({
      title: values.title,
      description: values.description.trim() || undefined,
      mode: values.mode,
      requireAuthentication,
      themeId: values.themeId,
      ...(expireAt ? { expireAt } : {}),
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid poll details");
      return;
    }

    try {
      const poll = await createPoll(parsed.data as CreatePollInput);
      await refreshUser();
      void navigate(`/app/polls/${poll.id}`, { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to create poll"));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Create
        </h1>
        <p className="mt-2 text-muted-foreground">
          {remaining == null
            ? "Unlimited creates on Pro."
            : `${remaining} free create${remaining === 1 ? "" : "s"} left today.`}
        </p>
      </div>

      <form
        className="space-y-5 rounded-xl border border-border bg-card/90 p-6 text-foreground shadow-none"
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        noValidate
      >
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Type</legend>
          <label className="flex items-start gap-2 text-sm">
            <input type="radio" value="quiz" {...register("mode")} className="mt-1" />
            <span>
              <span className="font-medium">Live quiz</span>
              <span className="block text-muted-foreground">
                One question at a time, timed answers, scoreboard. Users must
                sign in.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="radio" value="poll" {...register("mode")} className="mt-1" />
            <span>
              <span className="font-medium">Open poll</span>
              <span className="block text-muted-foreground">
                Classic form-style poll. Guests can vote unless you require
                sign-in.
              </span>
            </span>
          </label>
        </fieldset>

        <Field id="title" label="Title" error={errors.title?.message}>
          <input
            id="title"
            className={inputClassName}
            {...register("title", {
              required: "Title is required",
              minLength: { value: 3, message: "At least 3 characters" },
              maxLength: { value: 120, message: "At most 120 characters" },
            })}
          />
        </Field>

        <Field
          id="description"
          label="Description (optional)"
          error={errors.description?.message}
        >
          <textarea
            id="description"
            rows={3}
            className={textareaClassName}
            placeholder="Optional short description for voters"
            {...register("description", {
              maxLength: { value: 2000, message: "At most 2000 characters" },
            })}
          />
        </Field>

        {mode === "poll" ? (
          <ProFeatureGate plan={plan} label="Voter access">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                disabled={!canRequirePollAuthentication(plan)}
                {...register("requireAuthentication")}
              />
              Require voters to sign in
            </label>
          </ProFeatureGate>
        ) : (
          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            Live quizzes always require sign-in so each user can only answer
            once per question.
          </p>
        )}

        {mode === "poll" ? (
          <ProFeatureGate plan={plan} label="Expires at (optional)">
            <input
              id="expireAt"
              type="datetime-local"
              className={inputClassName}
              disabled={!canUsePollExpiry(plan)}
              {...register("expireAt")}
            />
          </ProFeatureGate>
        ) : null}

        <ThemePicker
          value={themeId}
          plan={plan}
          onChange={(id) =>
            setValue("themeId", id, { shouldDirty: true, shouldTouch: true })
          }
        />

        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground opacity-70"
              title="Coming soon"
            >
              Generate with AI
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Coming soon
              </span>
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Soon you’ll be able to draft questions and options from a topic.
          </p>
        </div>

        {formError ? (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className={`${primaryButtonClassName} w-auto interactive-press`}
            disabled={isSubmitting || remaining === 0}
          >
            {isSubmitting
              ? "Creating…"
              : mode === "quiz"
                ? "Create live quiz"
                : "Create poll"}
          </button>
          <Link
            to="/app"
            className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
