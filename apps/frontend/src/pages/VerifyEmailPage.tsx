import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resendVerificationSchema,
  verifyEmailSchema,
  type ResendVerificationInput,
  type VerifyEmailInput,
} from "@polling-system/shared";
import {
  Field,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/Field";
import { resendVerification, verifyEmail } from "@/features/auth/auth-api";
import { fieldError, getErrorMessage } from "@/features/auth/form-utils";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const verifyForm = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { token: tokenFromQuery },
  });

  const resendForm = useForm<ResendVerificationInput>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (tokenFromQuery) {
      verifyForm.setValue("token", tokenFromQuery);
    }
  }, [tokenFromQuery, verifyForm]);

  async function onVerify(values: VerifyEmailInput) {
    setFormError(null);
    try {
      await verifyEmail(values);
      setStatus("success");
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to verify email"));
    }
  }

  async function onResend(values: ResendVerificationInput) {
    setResendMessage(null);
    try {
      await resendVerification(values);
      setResendMessage(
        "If an account exists for that email, we sent instructions.",
      );
    } catch (error) {
      setResendMessage(getErrorMessage(error, "Unable to resend verification"));
    }
  }

  if (status === "success") {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-6 py-16">
        <h1 className="font-display text-3xl font-semibold">Email verified</h1>
        <p className="mt-3 text-[var(--color-muted)]">
          Your email is confirmed. You can sign in now.
        </p>
        <Link
          to="/login"
          className={`${primaryButtonClassName} mt-8 max-w-xs`}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-10 px-6 py-16">
      <div>
        <h1 className="font-display text-3xl font-semibold">Verify email</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Paste the token from your email, or open the verification link.
        </p>

        <form
          className="mt-8 space-y-4 rounded-xl border border-[var(--color-border)] bg-card/90 p-6"
          onSubmit={(event) =>
            void verifyForm.handleSubmit(onVerify)(event)
          }
          noValidate
        >
          <Field
            id="token"
            label="Verification token"
            error={fieldError(verifyForm.formState.errors, "token")}
          >
            <input
              id="token"
              className={inputClassName}
              {...verifyForm.register("token")}
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
            disabled={verifyForm.formState.isSubmitting}
          >
            {verifyForm.formState.isSubmitting ? "Verifying…" : "Verify email"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold">Resend link</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Didn’t get the email? Request another one.
        </p>
        <form
          className="mt-4 space-y-4 rounded-xl border border-[var(--color-border)] bg-card/90 p-6"
          onSubmit={(event) =>
            void resendForm.handleSubmit(onResend)(event)
          }
          noValidate
        >
          <Field
            id="email"
            label="Email"
            error={fieldError(resendForm.formState.errors, "email")}
          >
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={inputClassName}
              {...resendForm.register("email")}
            />
          </Field>

          {resendMessage ? (
            <p className="text-sm text-[var(--color-muted)]">{resendMessage}</p>
          ) : null}

          <button
            type="submit"
            className={secondaryButtonClassName}
            disabled={resendForm.formState.isSubmitting}
          >
            {resendForm.formState.isSubmitting ? "Sending…" : "Resend email"}
          </button>
        </form>
      </div>
    </div>
  );
}
