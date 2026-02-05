import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Folder,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { useVault } from "@/hooks/useVault";
import { useVaultStore } from "@/stores/vault-store";
import type { Folder as FolderType } from "@/stores/vault-store";
import {
  CATEGORY_COLORS,
  getCategoryBgClass,
} from "@/lib/category-colors";

export default function FoldersPage() {
  const navigate = useNavigate();
  const { folders, entries, save } = useVault();
  const addFolder = useVaultStore((s) => s.addFolder);
  const updateFolder = useVaultStore((s) => s.updateFolder);
  const deleteFolder = useVaultStore((s) => s.deleteFolder);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<
    (typeof CATEGORY_COLORS)[number]["value"]
  >(CATEGORY_COLORS[0].value);
  const [nameError, setNameError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const openCreateModal = () => {
    setEditingFolder(null);
    setName("");
    setColor(CATEGORY_COLORS[0].value);
    setNameError("");
    setModalOpen(true);
  };

  const openEditModal = (folder: FolderType) => {
    setEditingFolder(folder);
    setName(folder.name);
    const colorValue: (typeof CATEGORY_COLORS)[number]["value"] =
      CATEGORY_COLORS.some((c) => c.value === folder.color)
        ? (folder.color as (typeof CATEGORY_COLORS)[number]["value"])
        : CATEGORY_COLORS[0].value;
    setColor(colorValue);
    setNameError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingFolder(null);
    setName("");
    setColor(CATEGORY_COLORS[0].value);
    setNameError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Name is required.");
      return;
    }
    if (folders.some((f) => f.name.trim().toLowerCase() === trimmed.toLowerCase() && f.id !== editingFolder?.id)) {
      setNameError("A category with that name already exists.");
      return;
    }
    setIsSaving(true);
    try {
      if (editingFolder) {
        updateFolder(editingFolder.id, { name: trimmed, color: color || undefined });
      } else {
        addFolder({
          id: crypto.randomUUID(),
          name: trimmed,
          color: color || undefined,
        });
      }
      await save();
      closeModal();
    } catch (err) {
      console.error("Error saving category:", err);
      setNameError("Error saving. Check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (folderId: string) => {
    const count = entries.filter((e) => e.folderId === folderId).length;
    const msg =
      count > 0
        ? `Delete this category? ${count} password(s) will be moved to "Uncategorized".`
        : "Delete this category?";
    if (!window.confirm(msg)) return;
    try {
      deleteFolder(folderId);
      await save();
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  const getEntryCount = (folderId: string) =>
    entries.filter((e) => e.folderId === folderId).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Folder className="w-6 h-6 text-primary-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Categories
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto py-8 px-6 space-y-6">
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-slate-900 dark:text-white font-semibold">
              Your categories
            </h2>
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-bold rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add category
            </button>
          </div>

          {folders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <Folder className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                You don&apos;t have any categories yet. Create them to organize your passwords.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-bold rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create first category
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getCategoryBgClass(
                        folder.color
                      )}`}
                    >
                      <Folder className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-900 dark:text-white font-medium truncate">
                        {folder.name}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {getEntryCount(folder.id)} password(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(folder)}
                      className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-primary-500 transition-colors"
                      aria-label="Edit category"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(folder.id)}
                      className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      aria-label="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingFolder ? "Edit category" : "New category"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="folder-name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  Name
                </label>
                <input
                  id="folder-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  placeholder="e.g. Social, Work..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
                {nameError && (
                  <p className="mt-1 text-sm text-red-500">{nameError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-8 h-8 rounded-full ${c.bg} border-2 transition-all ${
                        color === c.value
                          ? "border-primary-500 ring-2 ring-primary-500/30"
                          : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                      aria-label={`Color ${c.value}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? "Saving…" : editingFolder ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
