import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Lock,
  SlidersHorizontal,
  Plus,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { PasswordCard, FolderChips } from "@/components/vault";
import { useVault } from "@/hooks/useVault";
import { useClipboard } from "@/hooks/useClipboard";
import type { VaultEntry, Folder } from "@/stores/vault-store";

type FilterTab = "all" | "favorites" | "recent";

interface VaultPageState {
  searchQuery: string;
  activeTab: FilterTab;
  selectedFolderId: string | null;
}

const getEntryColor = (title: string): string => {
  const colors = [
    "bg-blue-50 dark:bg-blue-900/30",
    "bg-red-50 dark:bg-red-900/30",
    "bg-green-50 dark:bg-green-900/30",
    "bg-orange-50 dark:bg-orange-900/30",
    "bg-purple-50 dark:bg-purple-900/30",
    "bg-pink-50 dark:bg-pink-900/30",
    "bg-yellow-50 dark:bg-yellow-900/30",
    "bg-cyan-50 dark:bg-cyan-900/30",
  ];

  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }

  const idx = Math.abs(hash) % colors.length;
  return colors[idx] ?? "bg-slate-100 dark:bg-slate-800";
};

const formatLastUsed = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

function buildFolderChips(folders: Folder[]): { id: string; name: string }[] {
  const allChip = { id: "", name: "All" };
  if (folders.length === 0) return [allChip];
  return [allChip, ...folders.map((f) => ({ id: f.id, name: f.name }))];
}

export default function VaultPage() {
  const navigate = useNavigate();
  const { entries, folders, isLoading, error } = useVault();
  const { copy } = useClipboard();

  const [state, setState] = useState<VaultPageState>({
    searchQuery: "",
    activeTab: "all",
    selectedFolderId: null,
  });

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

  const folderChips = useMemo(
    () => buildFolderChips(folders),
    [folders]
  );

  const handleCopy = async (password: string) => {
    const success = await copy(password);
    if (success) {
      // TODO: Toast de confirmación
    }
  };

  const handleLock = () => {
    navigate("/lock");
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
            Decrypting your vault...
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
            Error
          </h2>
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/connect")}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Volver a conectar
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
            Genmypass
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleLock}
            className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Lock vault"
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
                placeholder="Search credentials..."
                className="flex-1 border-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 px-4 text-base outline-none"
              />
            </div>
          </div>
          <button
            type="button"
            className="h-12 w-12 flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-500 transition-colors"
            aria-label="Filter"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex h-12 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 p-1.5 mb-6">
          {(
            [
              { key: "all" as const, label: `All (${entries.length})` },
              {
                key: "favorites" as const,
                label: `Favorites (${favoriteCount})`,
              },
              { key: "recent" as const, label: "Recent" },
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
              Your vault is empty
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
              Add your first password to start securing your digital life
            </p>
            <button
              type="button"
              onClick={() => navigate("/entry/new")}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Password
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
                iconBgColor={getEntryColor(entry.title)}
                isFavorite={entry.favorite}
                lastUsed={formatLastUsed(entry.updatedAt)}
                onCopy={() => handleCopy(entry.password)}
                onClick={() => navigate(`/entry/${entry.id}`)}
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
        aria-label="Add new password"
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}
