import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@polling-system/shared";
import { AuthShell } from "@/components/AuthShell";
import { Field, inputClassName } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthContext";
import { loginUser } from "@/features/auth/auth-api";
import { fieldError, getErrorMessage } from "@/features/auth/form-utils";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/app";
  }
  return raw;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSession } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    try {
      const session = await loginUser(values);
      setSession(session.user, session.accessToken);
      toast.success("Welcome back");
      void navigate(safeNextPath(searchParams.get("next")), { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to sign in"));
    }
  }

  return (
    <AuthShell
      title="Sign in"
      description="Use your email or username and password."
      footer={
        <>
          No account?{" "}
          <Link to="/register" className="text-foreground underline">
            Start free
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
          id="identifier"
          label="Email or username"
          error={fieldError(errors, "identifier")}
        >
          <input
            id="identifier"
            autoComplete="username"
            className={inputClassName}
            {...register("identifier")}
          />
        </Field>

        <Field
          id="password"
          label="Password"
          error={fieldError(errors, "password")}
        >
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={inputClassName}
            {...register("password")}
          />
        </Field>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-foreground underline"
          >
            Forgot password?
          </Link>
        </div>

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
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
