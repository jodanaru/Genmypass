import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const PROTECTED_PATH_PREFIXES = [
  "/vault",
  "/generator",
  "/settings",
  "/search",
  "/entry",
  "/connect",
  "/setup",
  "/auth/callback",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function OfflineGuard() {
  const isOnline = useOnlineStatus();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const pathname = location.pathname;
  const isOnOfflinePage = pathname === "/offline";

  useEffect(() => {
    if (!isOnline && isProtectedPath(pathname) && !isOnOfflinePage) {
      navigate("/offline", { replace: true });
    }
  }, [isOnline, pathname, isOnOfflinePage, navigate]);

  if (isOnline || isOnOfflinePage) return null;

  return (
    <div
      className="sticky top-0 z-50 bg-amber-900/90 text-amber-100 px-4 py-2 text-center text-sm"
      role="status"
      aria-live="polite"
    >
      {t("offline.banner")}
    </div>
  );
}
