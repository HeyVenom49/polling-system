import { useState } from "react";
import { Link } from "react-router";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const isPro = user?.plan === "pro";

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Account profile and security.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-card/90 p-6">
        <h2 className="font-display text-xl font-semibold">Profile</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Username</dt>
            <dd className="font-medium">{user?.username}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium capitalize">{user?.role}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Plan</dt>
            <dd>
              <Badge variant="secondary">{isPro ? "Pro" : "Free"}</Badge>
            </dd>
          </div>
        </dl>
        {!isPro ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Pro unlocks 5 extra themes, poll expiry, and require sign-in —
              plus unlimited daily creates.
            </p>
            <Button asChild size="sm" variant="brand" className="mt-3">
              <Link to="/app/pricing">View pricing</Link>
            </Button>
          </div>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link to="/app/pricing">View pricing</Link>
          </Button>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card/90 p-6">
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
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm text-brand" role="status">
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
