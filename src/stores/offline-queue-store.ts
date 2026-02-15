import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PendingVaultSave {
  encryptedContent: string;
  fileId: string;
}

interface OfflineQueueState {
  /** Single pending save (last one wins). Cleared after successful upload. */
  pendingSave: PendingVaultSave | null;
  setPendingSave: (payload: PendingVaultSave) => void;
  clearPendingSave: () => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set) => ({
      pendingSave: null,
      setPendingSave: (payload) => set({ pendingSave: payload }),
      clearPendingSave: () => set({ pendingSave: null }),
    }),
    { name: "genmypass-offline-queue" }
  )
);
