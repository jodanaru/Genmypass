import { useEffect } from "react";
import { saveVault } from "@/lib/cloud-storage";
import { useOfflineQueueStore } from "@/stores/offline-queue-store";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * When the app is online and there is a pending vault save (queued after a network
 * failure), tries to upload it. Clears the queue on success.
 */
export function FlushOfflineQueue() {
  const isOnline = useOnlineStatus();
  const pendingSave = useOfflineQueueStore((s) => s.pendingSave);
  const clearPendingSave = useOfflineQueueStore((s) => s.clearPendingSave);

  useEffect(() => {
    if (!isOnline || !pendingSave) return;

    let cancelled = false;
    saveVault(pendingSave.encryptedContent, pendingSave.fileId)
      .then(() => {
        if (!cancelled) clearPendingSave();
      })
      .catch((err) => {
        if (!cancelled) console.warn("Offline queue flush failed:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [isOnline, pendingSave, clearPendingSave]);

  return null;
}
