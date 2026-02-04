import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AutoLockTime = "1" | "5" | "15" | "never";

interface SettingsState {
  // Security
  autoLockMinutes: AutoLockTime;
  clearClipboard: boolean;
  clearClipboardSeconds: number;

  // Generator defaults
  defaultPasswordLength: number;
  includeNumbers: boolean;
  includeSymbols: boolean;
  includeUppercase: boolean;
  includeLowercase: boolean;
  excludeAmbiguousCharacters: boolean;
  allowDuplicateCharacters: boolean;

  // Actions
  setAutoLock: (minutes: AutoLockTime) => void;
  setClearClipboard: (enabled: boolean) => void;
  setDefaultPasswordLength: (length: number) => void;
  setIncludeNumbers: (include: boolean) => void;
  setIncludeSymbols: (include: boolean) => void;
  setIncludeUppercase: (include: boolean) => void;
  setIncludeLowercase: (include: boolean) => void;
  setExcludeAmbiguousCharacters: (exclude: boolean) => void;
  setAllowDuplicateCharacters: (allow: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      autoLockMinutes: "5",
      clearClipboard: false,
      clearClipboardSeconds: 30,
      defaultPasswordLength: 20,
      includeNumbers: true,
      includeSymbols: true,
      includeUppercase: true,
      includeLowercase: true,
      excludeAmbiguousCharacters: false,
      allowDuplicateCharacters: true,

      // Actions
      setAutoLock: (minutes) => set({ autoLockMinutes: minutes }),
      setClearClipboard: (enabled) => set({ clearClipboard: enabled }),
      setDefaultPasswordLength: (length) =>
        set({ defaultPasswordLength: length }),
      setIncludeNumbers: (include) => set({ includeNumbers: include }),
      setIncludeSymbols: (include) => set({ includeSymbols: include }),
      setIncludeUppercase: (include) => set({ includeUppercase: include }),
      setIncludeLowercase: (include) => set({ includeLowercase: include }),
      setExcludeAmbiguousCharacters: (exclude) =>
        set({ excludeAmbiguousCharacters: exclude }),
      setAllowDuplicateCharacters: (allow) =>
        set({ allowDuplicateCharacters: allow }),
    }),
    {
      name: "genmypass-settings",
    }
  )
);
