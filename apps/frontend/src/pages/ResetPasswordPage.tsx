import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@polling-system/shared";
import {
  Field,
  inputClassName,
  primaryButtonClassName,
} from "@/components/Field";
import { resetPassword } from "@/features/auth/auth-api";
import { fieldError, getErrorMessage } from "@/features/auth/form-utils";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get("token") ?? "";
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromQuery,
      password: "",
    },
  });

  useEffect(() => {
    if (tokenFromQuery) {
      setValue("token", tokenFromQuery);
    }
  }, [tokenFromQuery, setValue]);

  async function onSubmit(values: ResetPasswordInput) {
    setFormError(null);
    try {
      await resetPassword(values);
      void navigate("/login", { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to reset password"));
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl font-semibold">Reset password</h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Choose a new password using the token from your email.
      </p>

      <form
        className="mt-8 space-y-4 rounded-xl border border-[var(--color-border)] bg-card/90 p-6"
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        noValidate
      >
        <Field
          id="token"
          label="Reset token"
          error={fieldError(errors, "token")}
        >
          <input
            id="token"
            className={inputClassName}
            {...register("token")}
          />
        </Field>

        <Field
          id="password"
          label="New password"
          error={fieldError(errors, "password")}
          hint="At least 8 characters."
        >
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={inputClassName}
            {...register("password")}
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
          {isSubmitting ? "Saving…" : "Update password"}
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
