import { useState } from "react";
import { useTranslation } from "react-i18next";
import { saveVault } from "@/lib/cloud-storage";
import { useOfflineQueueStore } from "@/stores/offline-queue-store";

export function PendingSyncBanner() {
  const { t } = useTranslation();
  const pendingSave = useOfflineQueueStore((s) => s.pendingSave);
  const clearPendingSave = useOfflineQueueStore((s) => s.clearPendingSave);
  const [isRetrying, setIsRetrying] = useState(false);

  if (!pendingSave) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await saveVault(pendingSave.encryptedContent, pendingSave.fileId);
      clearPendingSave();
    } catch (err) {
      console.warn("Retry sync failed:", err);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      className="flex items-center justify-between gap-3 bg-amber-900/80 text-amber-100 px-4 py-2 text-sm"
      role="status"
      aria-live="polite"
    >
      <span>{t("sync.pending")}</span>
      <button
        type="button"
        onClick={handleRetry}
        disabled={isRetrying}
        className="px-3 py-1 rounded bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-sm font-medium"
      >
        {isRetrying ? t("common.loading") : t("sync.retryNow")}
      </button>
    </div>
  );
}
