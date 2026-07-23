import { Link } from "react-router";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthContext";

export function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="max-w-md space-y-6 text-center">
        <BrandMark className="inline-block" />
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
            404
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold">
            Page not found
          </h1>
          <p className="mt-2 text-muted-foreground">
            That link doesn’t match anything in Ballotly.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="brand">
            <Link to={isAuthenticated ? "/app" : "/"}>
              {isAuthenticated ? "Go to dashboard" : "Go home"}
            </Link>
          </Button>
          {!isAuthenticated ? (
            <Button asChild variant="outline">
              <Link to="/login">Sign in</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
