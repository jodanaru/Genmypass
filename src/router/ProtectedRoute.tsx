import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/** Por ahora mock: vault siempre desbloqueado. Si no está desbloqueado redirige a /lock. */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const isUnlocked = true; // TODO: leer estado real del vault (ej. store Zustand)

  if (!isUnlocked) {
    return <Navigate to="/lock" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
