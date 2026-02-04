interface FolderChipsProps {
  folders: { id: string; name: string }[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function FolderChips({
  folders,
  selectedId,
  onSelect,
}: FolderChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1">
      {folders.map((folder) => {
        const isSelected =
          (folder.id === "" && selectedId === null) || selectedId === folder.id;
        return (
          <button
            key={folder.id || "all"}
            type="button"
            onClick={() => onSelect(folder.id === "" ? null : folder.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isSelected
                ? "bg-primary-500 text-white"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            {folder.name}
          </button>
        );
      })}
    </div>
  );
}
