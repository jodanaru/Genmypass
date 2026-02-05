import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/**
 * Formats an ISO date string as a relative time (e.g. "2 days ago").
 * Uses current locale via i18next.
 * @deprecated Use useFormatRelative() in components for translated output.
 */
export function formatRelative(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays <= 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return `Over ${diffDays} days ago`;
}

/**
 * Hook that returns a function to format an ISO date string as relative time
 * using the current language (e.g. "Hace 2 días" / "2 days ago").
 */
export function useFormatRelative(): (isoDate: string) => string {
  const { t } = useTranslation();

  return useCallback(
    (isoDate: string): string => {
      const date = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 60) return t("time.justNow");
      if (diffMin < 60) return t("time.minutesAgo", { count: diffMin });
      if (diffHours < 24) return t("time.hoursAgo", { count: diffHours });
      if (diffDays === 1) return t("time.yesterday");
      if (diffDays <= 30) return t("time.daysAgo", { count: diffDays });
      return t("time.overDaysAgo", { count: diffDays });
    },
    [t]
  );
}
