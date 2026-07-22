import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  Shield,
} from "lucide-react";
import { NavLink, Outlet, Navigate } from "react-router";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthContext";
import { logoutUser } from "@/features/auth/auth-api";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/app", label: "Polls", icon: LayoutDashboard, end: true },
  { to: "/app/polls/new", label: "Create", icon: PlusCircle },
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/admin", label: "Admin", icon: Shield, adminOnly: true },
];

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-accent text-accent-foreground"
      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
  );
}

export function AppLayout() {
  const { user, isLoading, isAuthenticated, clearSession } = useAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } finally {
      clearSession();
    }
  }

  const limitLabel =
    user?.dailyLimit == null
      ? "Unlimited"
      : `${user.pollsCreatedToday ?? 0} / ${user.dailyLimit} today`;

  const planLabel = user?.plan === "pro" ? "Pro" : "Free";
  const initial = (user?.username?.[0] ?? "?").toUpperCase();
  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === "admin",
  );

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[248px_1fr]">
      <aside className="border-b border-border/60 bg-card/55 backdrop-blur-md md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:border-b-0 md:border-r md:border-border/60">
        <div className="flex items-center justify-between gap-3 px-4 py-4 md:px-5">
          <BrandMark className="block" />
          <ThemeToggle className="shrink-0" />
        </div>

        <nav
          aria-label="App"
          className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:px-3 md:pb-0"
        >
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(navClass({ isActive }), "shrink-0 md:w-full")
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-1/2 left-0 hidden h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand transition-opacity md:block",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <item.icon
                    className={cn(
                      "size-4 shrink-0",
                      isActive ? "text-brand" : "text-muted-foreground",
                    )}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden border-t border-border/60 p-4 md:block">
          <div className="flex items-start gap-3">
            <div
              aria-hidden
              className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.username}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="font-normal">
                  {planLabel}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {limitLabel}
                </span>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            onClick={() => void handleLogout()}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>

        {/* Mobile account strip */}
        <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3 md:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.username}</p>
              <p className="truncate text-xs text-muted-foreground">
                {planLabel} · {limitLabel}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Sign out"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => void handleLogout()}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      <div className="min-w-0 px-4 py-6 md:px-8 md:py-8">
        <Outlet />
      </div>
    </div>
  );
}
