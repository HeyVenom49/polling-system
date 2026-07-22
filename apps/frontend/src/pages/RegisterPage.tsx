import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "@polling-system/shared";
import { AuthShell } from "@/components/AuthShell";
import { Field, inputClassName } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { registerUser } from "@/features/auth/auth-api";
import { fieldError, getErrorMessage } from "@/features/auth/form-utils";

export function RegisterPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    try {
      await registerUser(values);
      setSuccessEmail(values.email);
      toast.success("Check your email to verify");
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to create account"));
    }
  }

  if (successEmail) {
    return (
      <AuthShell
        title="Check your email"
        description={`We sent a verification link to ${successEmail}. Verify before signing in.`}
        footer={
          <div className="space-y-2">
            <Link to="/verify-email" className="block underline">
              Enter verification token
            </Link>
            <Link to="/login" className="block underline">
              Back to sign in
            </Link>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Didn’t get it? Check spam, or request a new link from the verify page.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create account"
      description="Free to start. You’ll verify your email before the first sign-in."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="text-foreground underline">
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        noValidate
      >
        <Field
          id="username"
          label="Username"
          error={fieldError(errors, "username")}
          hint="Letters, numbers, underscores, hyphens."
        >
          <input
            id="username"
            autoComplete="username"
            className={inputClassName}
            {...register("username")}
          />
        </Field>

        <Field id="email" label="Email" error={fieldError(errors, "email")}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClassName}
            {...register("email")}
          />
        </Field>

        <Field
          id="password"
          label="Password"
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
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <Button
          type="submit"
          className="interactive-press w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
