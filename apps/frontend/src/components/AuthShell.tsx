import type { ReactNode } from "react";
import { PageShell } from "@/components/motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <PageShell className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-6 py-16">
      <Card className="border-border/70 bg-card/90 shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-3xl font-semibold">
            {title}
          </CardTitle>
          {description ? (
            <CardDescription className="text-base">{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
      {footer ? (
        <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
      ) : null}
    </PageShell>
  );
}
