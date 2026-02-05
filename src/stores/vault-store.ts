import { create } from "zustand";
import type { UserSettings } from "@/stores/settings-store";

export interface VaultEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  folderId?: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
}

export interface Vault {
  version: number;
  entries: VaultEntry[];
  folders: Folder[];
  settings?: UserSettings;
  createdAt: string;
  updatedAt: string;
}

interface VaultState {
  vault: Vault | null;
  isLoading: boolean;
  error: string | null;
  fileId: string | null;
  /** Salt en base64 del archivo del vault (para reescribir al guardar). */
  vaultFileSalt: string | null;

  setVault: (vault: Vault, fileId: string, vaultFileSalt?: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  addEntry: (entry: VaultEntry) => void;
  updateEntry: (id: string, updates: Partial<VaultEntry>) => void;
  deleteEntry: (id: string) => void;

  addFolder: (folder: Folder) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;

  toggleFavorite: (id: string) => void;

  clear: () => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  vault: null,
  isLoading: false,
  error: null,
  fileId: null,
  vaultFileSalt: null,

  setVault: (vault, fileId, vaultFileSalt = null) =>
    set({ vault, fileId, vaultFileSalt, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  addEntry: (entry) =>
    set((state) => ({
      vault: state.vault
        ? {
            ...state.vault,
            entries: [...state.vault.entries, entry],
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  updateEntry: (id, updates) =>
    set((state) => ({
      vault: state.vault
        ? {
            ...state.vault,
            entries: state.vault.entries.map((e) =>
              e.id === id
                ? { ...e, ...updates, updatedAt: new Date().toISOString() }
                : e
            ),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  deleteEntry: (id) =>
    set((state) => ({
      vault: state.vault
        ? {
            ...state.vault,
            entries: state.vault.entries.filter((e) => e.id !== id),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  addFolder: (folder) =>
    set((state) => ({
      vault: state.vault
        ? {
            ...state.vault,
            folders: [...state.vault.folders, folder],
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  updateFolder: (id, updates) =>
    set((state) => ({
      vault: state.vault
        ? {
            ...state.vault,
            folders: state.vault.folders.map((f) =>
              f.id === id ? { ...f, ...updates } : f
            ),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  deleteFolder: (id) =>
    set((state) => {
      if (!state.vault) return state;
      const updatedEntries = state.vault.entries.map((e) =>
        e.folderId === id
          ? { ...e, folderId: undefined, updatedAt: new Date().toISOString() }
          : e
      );
      return {
        ...state,
        vault: {
          ...state.vault,
          entries: updatedEntries,
          folders: state.vault.folders.filter((f) => f.id !== id),
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  toggleFavorite: (id) =>
    set((state) => ({
      vault: state.vault
        ? {
            ...state.vault,
            entries: state.vault.entries.map((e) =>
              e.id === id
                ? { ...e, favorite: !e.favorite, updatedAt: new Date().toISOString() }
                : e
            ),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  clear: () =>
    set({ vault: null, fileId: null, vaultFileSalt: null, error: null }),
}));
