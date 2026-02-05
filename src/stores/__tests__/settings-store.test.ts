import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_USER_SETTINGS,
  getSettingsForVault,
  useSettingsStore,
  type UserSettings,
} from "../settings-store";

describe("settings-store (vault sync)", () => {
  beforeEach(() => {
    useSettingsStore.getState().setSettingsFromVault(DEFAULT_USER_SETTINGS);
  });

  describe("DEFAULT_USER_SETTINGS", () => {
    it("tiene todos los campos de UserSettings", () => {
      const keys: (keyof UserSettings)[] = [
        "autoLockMinutes",
        "clearClipboard",
        "clearClipboardSeconds",
        "defaultPasswordLength",
        "includeNumbers",
        "includeSymbols",
        "includeUppercase",
        "includeLowercase",
        "excludeAmbiguousCharacters",
        "allowDuplicateCharacters",
      ];
      for (const key of keys) {
        expect(DEFAULT_USER_SETTINGS).toHaveProperty(key);
      }
      expect(Object.keys(DEFAULT_USER_SETTINGS).sort()).toEqual(keys.sort());
    });

    it("tiene valores por defecto coherentes", () => {
      expect(DEFAULT_USER_SETTINGS.autoLockMinutes).toBe("5");
      expect(DEFAULT_USER_SETTINGS.defaultPasswordLength).toBe(20);
      expect(DEFAULT_USER_SETTINGS.includeUppercase).toBe(true);
      expect(DEFAULT_USER_SETTINGS.includeLowercase).toBe(true);
    });
  });

  describe("getSettingsForVault", () => {
    it("devuelve el mismo shape que UserSettings", () => {
      const out = getSettingsForVault();
      expect(out).toEqual(expect.objectContaining(DEFAULT_USER_SETTINGS));
      expect(Object.keys(out).sort()).toEqual(
        Object.keys(DEFAULT_USER_SETTINGS).sort()
      );
    });

    it("devuelve los valores actuales del store", () => {
      useSettingsStore.getState().setAutoLock("15");
      useSettingsStore.getState().setDefaultPasswordLength(24);
      const out = getSettingsForVault();
      expect(out.autoLockMinutes).toBe("15");
      expect(out.defaultPasswordLength).toBe(24);
    });
  });

  describe("setSettingsFromVault", () => {
    it("actualiza el state con los valores recibidos", () => {
      const custom: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        autoLockMinutes: "never",
        defaultPasswordLength: 12,
        includeSymbols: false,
      };
      useSettingsStore.getState().setSettingsFromVault(custom);
      expect(getSettingsForVault()).toEqual(custom);
    });

    it("roundtrip: setSettingsFromVault + getSettingsForVault devuelve lo mismo", () => {
      const custom: UserSettings = {
        autoLockMinutes: "1",
        clearClipboard: true,
        clearClipboardSeconds: 60,
        defaultPasswordLength: 16,
        includeNumbers: false,
        includeSymbols: true,
        includeUppercase: true,
        includeLowercase: true,
        excludeAmbiguousCharacters: true,
        allowDuplicateCharacters: false,
      };
      useSettingsStore.getState().setSettingsFromVault(custom);
      expect(getSettingsForVault()).toEqual(custom);
    });
  });
});
