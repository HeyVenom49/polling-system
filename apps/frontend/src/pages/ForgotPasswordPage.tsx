import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@polling-system/shared";
import {
  Field,
  inputClassName,
  primaryButtonClassName,
} from "@/components/Field";
import { forgotPassword } from "@/features/auth/auth-api";
import { fieldError, getErrorMessage } from "@/features/auth/form-utils";

export function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setFormError(null);
    try {
      await forgotPassword(values);
      setSent(true);
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to send reset email"));
    }
  }

  if (sent) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-6 py-16">
        <h1 className="font-display text-3xl font-semibold">Check your email</h1>
        <p className="mt-3 text-[var(--color-muted)]">
          If an account exists for that email, we sent password reset
          instructions.
        </p>
        <Link
          to="/reset-password"
          className="mt-6 text-[var(--color-primary)] underline"
        >
          Enter reset token
        </Link>
        <Link to="/login" className="mt-3 text-[var(--color-primary)] underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl font-semibold">Forgot password</h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Enter your account email and we’ll send a reset link.
      </p>

      <form
        className="mt-8 space-y-4 rounded-xl border border-[var(--color-border)] bg-card/90 p-6"
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        noValidate
      >
        <Field id="email" label="Email" error={fieldError(errors, "email")}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClassName}
            {...register("email")}
          />
        </Field>

        {formError ? (
          <p className="text-sm text-[var(--color-danger)]" role="alert">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          className={primaryButtonClassName}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending…" : "Send reset email"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--color-muted)]">
        <Link to="/login" className="text-[var(--color-primary)] underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
