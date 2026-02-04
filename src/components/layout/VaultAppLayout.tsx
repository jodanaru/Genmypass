import { Outlet } from "react-router-dom";
import { ProtectedRoute } from "@/router/ProtectedRoute";
import { useAutoLock } from "@/hooks/useAutoLock";
import { BottomNav } from "./BottomNav";

export function VaultAppLayout() {
  useAutoLock();

  return (
    <ProtectedRoute>
      <Outlet />
      <BottomNav />
    </ProtectedRoute>
  );
}
