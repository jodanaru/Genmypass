import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  Lock,
  Plus,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { PasswordCard, FolderChips } from "@/components/vault";
import { useVault } from "@/hooks/useVault";
import { useClipboard } from "@/hooks/useClipboard";
import { useVaultStore } from "@/stores/vault-store";
import type { VaultEntry, Folder } from "@/stores/vault-store";
import { getCategoryBgClass, UNCATEGORIZED_BG } from "@/lib/category-colors";
import { useFormatRelative } from "@/lib/format-relative";

type FilterTab = "all" | "favorites" | "recent";

interface VaultPageState {
  searchQuery: string;
  activeTab: FilterTab;
  selectedFolderId: string | null;
}

function getEntryIconBg(entry: VaultEntry, folders: Folder[]): string {
  if (!entry.folderId) return UNCATEGORIZED_BG;
  const folder = folders.find((f) => f.id === entry.folderId);
  return folder ? getCategoryBgClass(folder.color) : UNCATEGORIZED_BG;
}

export default function VaultPage() {
  const { t } = useTranslation();
  const formatRelative = useFormatRelative();
  const navigate = useNavigate();
  const { entries, folders, isLoading, error, save } = useVault();
  const { copy } = useClipboard();
  const toggleFavorite = useVaultStore((s) => s.toggleFavorite);

  const folderChips = useMemo(() => {
    const allChip = { id: "", name: t("vault.all") };
    if (folders.length === 0) return [allChip];
    return [allChip, ...folders.map((f) => ({ id: f.id, name: f.name }))];
  }, [folders, t]);

  const [state, setState] = useState<VaultPageState>({
    searchQuery: "",
    activeTab: "all",
    selectedFolderId: null,
  });
  const [copiedEntryId, setCopiedEntryId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    let result = entries;

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.username.toLowerCase().includes(query)
      );
    }

    if (state.activeTab === "favorites") {
      result = result.filter((e) => e.favorite);
    }

    if (state.selectedFolderId) {
      result = result.filter((e) => e.folderId === state.selectedFolderId);
    }

    if (state.activeTab === "recent") {
      result = [...result].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    return result;
  }, [entries, state.searchQuery, state.activeTab, state.selectedFolderId]);

  const favoriteCount = useMemo(
    () => entries.filter((e) => e.favorite).length,
    [entries]
  );

  const handleCopy = async (entryId: string, password: string) => {
    const success = await copy(password);
    if (success) {
      setCopiedEntryId(entryId);
      setTimeout(() => setCopiedEntryId(null), 5000);
    }
  };

  const handleLock = () => {
    navigate("/lock");
  };

  const handleFavoriteClick = async (entryId: string) => {
    toggleFavorite(entryId);
    try {
      await save();
    } catch (err) {
      console.error("Error saving favorite:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin w-10 h-10 text-primary-500"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-slate-500 dark:text-slate-400">
            {t("vault.decrypting")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="text-center">
          <AlertTriangle
            className="w-16 h-16 mx-auto mb-4 text-red-500"
            aria-hidden
          />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {t("errors.title")}
          </h2>
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/connect")}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {t("vault.reconnect")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-primary-500 rounded-lg flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5" aria-hidden />
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold">
            {t("lock.title")}
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleLock}
            className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label={t("vault.ariaLock")}
          >
            <Lock className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {/* Search bar */}
        <div className="flex gap-3 items-center mb-6">
          <div className="flex-1 h-12">
            <div className="flex w-full h-full items-stretch rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="text-slate-500 flex bg-white dark:bg-slate-900 items-center justify-center pl-4">
                <Search className="w-5 h-5" aria-hidden />
              </div>
              <input
                type="text"
                value={state.searchQuery}
                onChange={(e) =>
                  setState((s) => ({ ...s, searchQuery: e.target.value }))
                }
                placeholder={t("vault.searchPlaceholder")}
                className="flex-1 border-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 px-4 text-base outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex h-12 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 p-1.5 mb-6">
          {(
            [
              { key: "all" as const, label: `${t("vault.all")} (${entries.length})` },
              {
                key: "favorites" as const,
                label: `${t("vault.favorites")} (${favoriteCount})`,
              },
              { key: "recent" as const, label: t("vault.recent") },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() =>
                setState((s) => ({ ...s, activeTab: tab.key }))
              }
              className={`flex-1 h-full rounded-lg px-2 text-sm font-semibold transition-all ${
                state.activeTab === tab.key
                  ? "bg-white dark:bg-slate-700 shadow-sm text-primary-500"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Folder chips */}
        <div className="mb-6">
          <FolderChips
            folders={folderChips}
            selectedId={state.selectedFolderId}
            onSelect={(id) =>
              setState((s) => ({ ...s, selectedFolderId: id }))
            }
          />
        </div>

        {/* Password list or empty state */}
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-slate-400" aria-hidden />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {t("vault.emptyTitle")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
              {t("vault.emptySubtitle")}
            </p>
            <button
              type="button"
              onClick={() => navigate("/entry/new")}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t("vault.addPassword")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry: VaultEntry) => (
              <PasswordCard
                key={entry.id}
                id={entry.id}
                title={entry.title}
                username={entry.username}
                iconBgColor={getEntryIconBg(entry, folders)}
                isFavorite={entry.favorite}
                lastUsed={formatRelative(entry.updatedAt)}
                copySuccess={copiedEntryId === entry.id}
                onCopy={() => handleCopy(entry.id, entry.password)}
                onClick={() => navigate(`/entry/${entry.id}/edit`)}
                onFavoriteClick={() => handleFavoriteClick(entry.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        type="button"
        onClick={() => navigate("/entry/new")}
        className="fixed bottom-24 right-8 size-14 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-primary-500/40 hover:scale-105 active:scale-95 transition-transform z-40"
        aria-label={t("vault.ariaAddPassword")}
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}
