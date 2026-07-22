import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import {
  createPollSchema,
  DEFAULT_POLL_THEME_ID,
  FREE_DAILY_POLL_LIMIT,
  POLL_THEMES,
  POLL_THEME_IDS,
  type CreatePollInput,
  type PollThemeId,
} from "@polling-system/shared";
import {
  Field,
  inputClassName,
  textareaClassName,
  primaryButtonClassName,
} from "@/components/Field";
import { useAuth } from "@/features/auth/AuthContext";
import { getErrorMessage } from "@/features/auth/form-utils";
import { createPoll } from "@/features/polls/poll-api";
import { fromDatetimeLocalValue } from "@/lib/datetime";

type CreatePollFormValues = {
  title: string;
  description: string;
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
    formState: { isSubmitting, errors },
  } = useForm<CreatePollFormValues>({
    defaultValues: {
      title: "",
      description: "",
      requireAuthentication: false,
      themeId: DEFAULT_POLL_THEME_ID,
      expireAt: "",
    },
  });

  const themeId = watch("themeId");

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
    const expireAt = fromDatetimeLocalValue(values.expireAt);
    const parsed = createPollSchema.safeParse({
      title: values.title,
      description: values.description.trim() || undefined,
      requireAuthentication: values.requireAuthentication,
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
          Create poll
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

        <Field
          id="expireAt"
          label="Expires at (optional)"
          hint="Leave empty for no expiration."
        >
          <input
            id="expireAt"
            type="datetime-local"
            className={inputClassName}
            {...register("expireAt")}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" {...register("requireAuthentication")} />
          Require voters to sign in
        </label>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">Theme</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {POLL_THEME_IDS.map((id) => {
              const theme = POLL_THEMES[id];
              const selected = themeId === id;
              return (
                <label
                  key={id}
                  className={`cursor-pointer rounded-lg border p-3 ${
                    selected
                      ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/30"
                      : "border-border"
                  }`}
                  style={{
                    background: theme.cssVars["--poll-bg"],
                    color: theme.cssVars["--poll-text"],
                  }}
                >
                  <input
                    type="radio"
                    value={id}
                    className="sr-only"
                    {...register("themeId")}
                  />
                  <span className="block font-display font-semibold">
                    {theme.label}
                  </span>
                  <span
                    className="mt-1 block text-xs"
                    style={{ color: theme.cssVars["--poll-muted"] }}
                  >
                    {theme.description}
                  </span>
                  <span
                    className="mt-3 inline-block rounded px-2 py-1 text-xs font-medium"
                    style={{
                      background: theme.cssVars["--poll-accent"],
                      color: theme.cssVars["--poll-accent-text"],
                    }}
                  >
                    Accent
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

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
            {isSubmitting ? "Creating…" : "Create poll"}
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
