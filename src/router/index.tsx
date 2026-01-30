import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { ProtectedRoute } from "./ProtectedRoute";
import { Landing } from "@/pages";
import {
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

  // Rutas especiales
  { path: "/lock", element: <LockScreenPage /> },
  { path: "/offline", element: <OfflinePage /> },
  { path: "/error", element: <ErrorPage /> },

  // Rutas protegidas (con MainLayout)
  {
    element: <ProtectedLayout />,
    children: [
      { path: "vault", element: <VaultPage /> },
      { path: "entry/:id", element: <EntryDetailPage /> },
      { path: "entry/new", element: <EntryFormPage /> },
      { path: "entry/:id/edit", element: <EntryFormPage /> },
      { path: "generator", element: <GeneratorPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "settings/password", element: <ChangePasswordPage /> },
      { path: "folders", element: <FoldersPage /> },
    ],
  },

  // Fallback
  { path: "*", element: <Navigate to="/" replace /> },
]);
