import { Link, Outlet } from "react-router";
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
              <Button asChild variant="brand" size="sm" className="interactive-press">
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
      <footer className="border-t border-border/60 px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Ballotly. Build polls. Watch them live.
      </footer>
    </div>
  );
}
