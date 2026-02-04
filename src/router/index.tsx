import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { MainLayout, VaultAppLayout } from "@/components/layout";
import { ProtectedRoute } from "./ProtectedRoute";
import { Landing } from "@/pages";
import {
  AuthCallbackPage,
  ConnectCloudPage,
  SetupPasswordPage,
  SetupSecurityModePage,
  SetupSecretKeyPage,
  VaultPage,
  EntryDetailPage,
  EntryFormPage,
  GeneratorPage,
  SearchPage,
  SettingsPage,
  ChangePasswordPage,
  FoldersPage,
  LockScreenPage,
  OfflinePage,
  ErrorPage,
} from "@/pages";

const ProtectedLayout = () => (
  <ProtectedRoute>
    <MainLayout>
      <Outlet />
    </MainLayout>
  </ProtectedRoute>
);

export const router = createBrowserRouter([
  // Landing (página inicial pública)
  { path: "/", element: <Landing /> },

  // Rutas públicas (onboarding)
  { path: "/connect", element: <ConnectCloudPage /> },
  { path: "/setup/password", element: <SetupPasswordPage /> },
  { path: "/setup/security", element: <SetupSecurityModePage /> },
  { path: "/setup/secret-key", element: <SetupSecretKeyPage /> },
  { path: "/auth/callback", element: <AuthCallbackPage /> },

  // Rutas especiales
  { path: "/lock", element: <LockScreenPage /> },
  { path: "/offline", element: <OfflinePage /> },
  { path: "/error", element: <ErrorPage /> },

  // Rutas protegidas con bottom nav (sin MainLayout)
  {
    element: <VaultAppLayout />,
    children: [
      { path: "vault", element: <VaultPage /> },
      { path: "generator", element: <GeneratorPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },

  // Rutas protegidas con MainLayout (sidebar)
  {
    element: <ProtectedLayout />,
    children: [
      { path: "entry/:id", element: <EntryDetailPage /> },
      { path: "entry/new", element: <EntryFormPage /> },
      { path: "entry/:id/edit", element: <EntryFormPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "settings/password", element: <ChangePasswordPage /> },
      { path: "folders", element: <FoldersPage /> },
    ],
  },

  // Fallback
  { path: "*", element: <Navigate to="/" replace /> },
]);
