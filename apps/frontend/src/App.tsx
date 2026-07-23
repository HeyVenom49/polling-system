import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ThemeProvider } from "@/features/theme/ThemeContext";
import { MarketingLayout } from "@/layouts/MarketingLayout";
import { LandingPage } from "@/pages/LandingPage";

const AppLayout = lazy(() =>
  import("@/layouts/AppLayout").then((m) => ({ default: m.AppLayout })),
);
const AdminPage = lazy(() =>
  import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })),
);
const CreatePollPage = lazy(() =>
  import("@/pages/CreatePollPage").then((m) => ({ default: m.CreatePollPage })),
);
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const ForgotPasswordPage = lazy(() =>
  import("@/pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);
const PollManagePage = lazy(() =>
  import("@/pages/PollManagePage").then((m) => ({ default: m.PollManagePage })),
);
const PricingPage = lazy(() =>
  import("@/pages/PricingPage").then((m) => ({ default: m.PricingPage })),
);
const RegisterPage = lazy(() =>
  import("@/pages/RegisterPage").then((m) => ({ default: m.RegisterPage })),
);
const ResetPasswordPage = lazy(() =>
  import("@/pages/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const TakePollPage = lazy(() =>
  import("@/pages/TakePollPage").then((m) => ({ default: m.TakePollPage })),
);
const VerifyEmailPage = lazy(() =>
  import("@/pages/VerifyEmailPage").then((m) => ({
    default: m.VerifyEmailPage,
  })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function RouteFallback() {
  return (
    <div
      className='grid min-h-[40vh] place-items-center text-sm text-muted-foreground'
      aria-busy='true'
      aria-live='polite'
    >
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route element={<MarketingLayout />}>
                  <Route
                    index
                    element={<LandingPage />}
                  />
                  <Route
                    path='login'
                    element={<LoginPage />}
                  />
                  <Route
                    path='register'
                    element={<RegisterPage />}
                  />
                  <Route
                    path='verify-email'
                    element={<VerifyEmailPage />}
                  />
                  <Route
                    path='forgot-password'
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path='reset-password'
                    element={<ResetPasswordPage />}
                  />
                </Route>
                <Route
                  path='p/:shareId'
                  element={<TakePollPage />}
                />
                <Route
                  path='app'
                  element={<AppLayout />}
                >
                  <Route
                    index
                    element={<DashboardPage />}
                  />
                  <Route
                    path='polls/new'
                    element={<CreatePollPage />}
                  />
                  <Route
                    path='polls/:pollId'
                    element={<PollManagePage />}
                  />
                  <Route
                    path='pricing'
                    element={<PricingPage />}
                  />
                  <Route
                    path='admin'
                    element={<AdminPage />}
                  />
                  <Route
                    path='settings'
                    element={<SettingsPage />}
                  />
                </Route>
                <Route
                  path='*'
                  element={<NotFoundPage />}
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster
            position='top-center'
            richColors
            closeButton
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
