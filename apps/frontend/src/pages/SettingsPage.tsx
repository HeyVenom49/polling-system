import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@polling-system/shared";
import {
  Field,
  inputClassName,
  primaryButtonClassName,
} from "@/components/Field";
import { useAuth } from "@/features/auth/AuthContext";
import { changePassword } from "@/features/auth/auth-api";
import { fieldError, getErrorMessage } from "@/features/auth/form-utils";

export function SettingsPage() {
  const { user } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordInput) {
    setFormError(null);
    setSuccess(false);
    try {
      await changePassword(values);
      reset();
      setSuccess(true);
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to change password"));
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Signed in as{" "}
          <span className="font-medium text-[var(--color-text)]">
            {user?.email}
          </span>
        </p>
      </div>

      <section className="rounded-xl border border-[var(--color-border)] bg-card/90 p-6">
        <h2 className="font-display text-xl font-semibold">Change password</h2>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
          noValidate
        >
          <Field
            id="currentPassword"
            label="Current password"
            error={fieldError(errors, "currentPassword")}
          >
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              className={inputClassName}
              {...register("currentPassword")}
            />
          </Field>

          <Field
            id="newPassword"
            label="New password"
            error={fieldError(errors, "newPassword")}
            hint="Must be different from your current password."
          >
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              className={inputClassName}
              {...register("newPassword")}
            />
          </Field>

          {formError ? (
            <p className="text-sm text-[var(--color-danger)]" role="alert">
              {formError}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm text-[var(--color-accent)]" role="status">
              Password updated.
            </p>
          ) : null}

          <button
            type="submit"
            className={primaryButtonClassName}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving…" : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
