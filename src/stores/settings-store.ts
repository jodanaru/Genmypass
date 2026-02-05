import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AutoLockTime = "1" | "5" | "15" | "never";

/** Serializable settings stored inside the encrypted vault (synced across devices). */
export interface UserSettings {
  autoLockMinutes: AutoLockTime;
  clearClipboard: boolean;
  clearClipboardSeconds: number;
  defaultPasswordLength: number;
  includeNumbers: boolean;
  includeSymbols: boolean;
  includeUppercase: boolean;
  includeLowercase: boolean;
  excludeAmbiguousCharacters: boolean;
  allowDuplicateCharacters: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
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
};

interface SettingsState extends UserSettings {
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
  setSettingsFromVault: (settings: UserSettings) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_USER_SETTINGS,

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
      setSettingsFromVault: (settings) => set(settings),
    }),
    {
      name: "genmypass-settings",
    }
  )
);

/** Returns current settings for persisting into the encrypted vault. */
export function getSettingsForVault(): UserSettings {
  const state = useSettingsStore.getState();
  return {
    autoLockMinutes: state.autoLockMinutes,
    clearClipboard: state.clearClipboard,
    clearClipboardSeconds: state.clearClipboardSeconds,
    defaultPasswordLength: state.defaultPasswordLength,
    includeNumbers: state.includeNumbers,
    includeSymbols: state.includeSymbols,
    includeUppercase: state.includeUppercase,
    includeLowercase: state.includeLowercase,
    excludeAmbiguousCharacters: state.excludeAmbiguousCharacters,
    allowDuplicateCharacters: state.allowDuplicateCharacters,
  };
}
