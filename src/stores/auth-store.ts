import { create } from "zustand";

interface AuthState {
  masterKey: Uint8Array | null;
  isUnlocked: boolean;
  setMasterKey: (key: Uint8Array) => void;
  lock: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  masterKey: null,
  isUnlocked: false,
  setMasterKey: (key) => set({ masterKey: key, isUnlocked: true }),
  lock: () => set({ masterKey: null, isUnlocked: false }),
}));
