import { Link, Outlet } from "react-router";
import { BRAND_NAME } from "@polling-system/shared";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthContext";

export function MarketingLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/75 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <BrandMark />
          <nav className="flex items-center gap-2 text-sm text-muted-foreground sm:gap-3">
            <a
              href="/#how-it-works"
              className="hidden hover:text-foreground md:inline"
            >
              How it works
            </a>
            <a
              href="/#features"
              className="hidden hover:text-foreground sm:inline"
            >
              Features
            </a>
            <a
              href="/#pricing"
              className="hidden hover:text-foreground sm:inline"
            >
              Pricing
            </a>
            <ThemeToggle />
            {isAuthenticated ? (
              <Button
                asChild
                variant="brand"
                size="sm"
                className="interactive-press"
              >
                <Link to="/app">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="interactive-press">
                  <Link to="/register">Start free</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border/60 px-6 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BrandMark />
            <p className="mt-2 text-sm text-muted-foreground">
              © {new Date().getFullYear()} {BRAND_NAME}. Build polls. Watch them
              live.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <a href="/#how-it-works" className="hover:text-foreground">
              How it works
            </a>
            <a href="/#features" className="hover:text-foreground">
              Features
            </a>
            <a href="/#pricing" className="hover:text-foreground">
              Pricing
            </a>
            <Link to="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link to="/register" className="hover:text-foreground">
              Start free
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
