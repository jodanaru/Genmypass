import { Outlet } from "react-router-dom";
import { ProtectedRoute } from "@/router/ProtectedRoute";
import { useAutoLock } from "@/hooks/useAutoLock";
import { BottomNav } from "./BottomNav";
import { PendingSyncBanner } from "@/components/PendingSyncBanner";

export function VaultAppLayout() {
  useAutoLock();

  return (
    <ProtectedRoute>
      <PendingSyncBanner />
      <Outlet />
      <BottomNav />
    </ProtectedRoute>
  );
}
