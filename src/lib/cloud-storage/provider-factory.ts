import type { CloudProvider, CloudStorageProvider } from "./types.js";
import { GoogleDriveProvider } from "./google-drive";
import { DropboxProvider } from "./dropbox";

const STORAGE_KEY = "genmypass_cloud_provider";

export function createProvider(provider: CloudProvider): CloudStorageProvider {
  switch (provider) {
    case "google-drive":
      return new GoogleDriveProvider();
    case "dropbox":
      return new DropboxProvider();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export function getStoredProvider(): CloudProvider | null {
  if (typeof localStorage === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "google-drive" || stored === "dropbox" ? stored : null;
}

export function setStoredProvider(provider: CloudProvider): void {
  localStorage.setItem(STORAGE_KEY, provider);
}

export function getCurrentProvider(): CloudStorageProvider | null {
  const stored = getStoredProvider();
  return stored ? createProvider(stored) : null;
}
