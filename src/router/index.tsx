import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { ThemeAndLanguageBar, VaultAppLayout } from "@/components/layout";
import { Landing } from "@/pages";
import {
  AuthCallbackPage,
  ConnectCloudPage,
  SetupPasswordPage,
  SetupSecurityModePage,
  SetupSecretKeyPage,
  SlidesPage,
  VaultPage,
  EntryDetailPage,
  EntryFormPage,
  GeneratorPage,
  SearchPage,
  SettingsPage,
  ChangePasswordPage,
  FoldersPage,
  SecurityAuditPage,
  ExportPage,
  ImportPage,
  LockScreenPage,
  OfflinePage,
  ErrorPage,
} from "@/pages";

function RootLayout() {
  return (
    <>
      <ThemeAndLanguageBar />
      <Outlet />
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
