import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { ThemeAndLanguageBar, VaultAppLayout } from "@/components/layout";

const Landing = lazy(() => import("@/pages/Landing").then((m) => ({ default: m.Landing })));
const AuthCallbackPage = lazy(() => import("@/pages/onboarding/AuthCallbackPage"));
const ConnectCloudPage = lazy(() => import("@/pages/onboarding/ConnectCloudPage"));
const SetupPasswordPage = lazy(() => import("@/pages/onboarding/SetupPasswordPage"));
const SetupSecurityModePage = lazy(() => import("@/pages/onboarding/SetupSecurityModePage"));
const SetupSecretKeyPage = lazy(() => import("@/pages/onboarding/SetupSecretKeyPage"));
const SlidesPage = lazy(() => import("@/pages/SlidesPage"));
const LockScreenPage = lazy(() => import("@/pages/special/LockScreenPage"));
const OfflinePage = lazy(() => import("@/pages/special/OfflinePage"));
const ErrorPage = lazy(() => import("@/pages/special/ErrorPage"));
const VaultPage = lazy(() => import("@/pages/vault/VaultPage"));
const EntryDetailPage = lazy(() => import("@/pages/vault/EntryDetailPage"));
const EntryFormPage = lazy(() => import("@/pages/vault/EntryFormPage"));
const GeneratorPage = lazy(() => import("@/pages/vault/GeneratorPage"));
const SearchPage = lazy(() => import("@/pages/vault/SearchPage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
const ChangePasswordPage = lazy(() => import("@/pages/settings/ChangePasswordPage"));
const FoldersPage = lazy(() => import("@/pages/settings/FoldersPage"));
const SecurityAuditPage = lazy(() => import("@/pages/settings/SecurityAuditPage"));
const ExportPage = lazy(() => import("@/pages/settings/ExportPage"));
const ImportPage = lazy(() => import("@/pages/settings/ImportPage"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function RootLayout() {
  return (
    <>
      <ThemeAndLanguageBar />
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/connect", element: <ConnectCloudPage /> },
      { path: "/setup/password", element: <SetupPasswordPage /> },
      { path: "/setup/security", element: <SetupSecurityModePage /> },
      { path: "/setup/secret-key", element: <SetupSecretKeyPage /> },
      { path: "/auth/callback", element: <AuthCallbackPage /> },
      { path: "/slides", element: <SlidesPage /> },
      { path: "/lock", element: <LockScreenPage /> },
      { path: "/offline", element: <OfflinePage /> },
      { path: "/error", element: <ErrorPage /> },
      {
        element: <VaultAppLayout />,
        children: [
          { path: "vault", element: <VaultPage /> },
          { path: "generator", element: <GeneratorPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "entry/:id", element: <EntryDetailPage /> },
          { path: "entry/new", element: <EntryFormPage /> },
          { path: "entry/:id/edit", element: <EntryFormPage /> },
          { path: "search", element: <SearchPage /> },
          { path: "settings/password", element: <ChangePasswordPage /> },
          { path: "settings/folders", element: <FoldersPage /> },
          { path: "settings/security-audit", element: <SecurityAuditPage /> },
          { path: "settings/export", element: <ExportPage /> },
          { path: "settings/import", element: <ImportPage /> },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
