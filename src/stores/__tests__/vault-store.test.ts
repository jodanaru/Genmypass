import { describe, it, expect } from "vitest";
import type { Vault } from "../vault-store";
import { DEFAULT_USER_SETTINGS } from "../settings-store";

describe("Vault (compatibilidad settings opcional)", () => {
  const baseVault = {
    version: 1,
    entries: [],
    folders: [],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  };

  it("vault sin settings es válido y se puede serializar/parsear", () => {
    const vault: Vault = { ...baseVault };
    expect(vault.settings).toBeUndefined();
    const json = JSON.stringify(vault);
    const parsed = JSON.parse(json) as Vault;
    expect(parsed.version).toBe(1);
    expect(parsed.entries).toEqual([]);
    expect(parsed.folders).toEqual([]);
    expect(parsed.settings).toBeUndefined();
  });

  it("vault con settings preserva settings al serializar/parsear", () => {
    const vault: Vault = {
      ...baseVault,
      settings: DEFAULT_USER_SETTINGS,
    };
    const json = JSON.stringify(vault);
    const parsed = JSON.parse(json) as Vault;
    expect(parsed.settings).toEqual(DEFAULT_USER_SETTINGS);
    expect(parsed.settings?.autoLockMinutes).toBe("5");
    expect(parsed.settings?.defaultPasswordLength).toBe(20);
  });

  it("vault con settings personalizadas roundtrip", () => {
    const customSettings = {
      ...DEFAULT_USER_SETTINGS,
      autoLockMinutes: "never" as const,
      defaultPasswordLength: 24,
    };
    const vault: Vault = { ...baseVault, settings: customSettings };
    const parsed = JSON.parse(JSON.stringify(vault)) as Vault;
    expect(parsed.settings).toEqual(customSettings);
  });
});
