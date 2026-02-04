import { Copy, ChevronRight, Star } from "lucide-react";

interface PasswordCardProps {
  id: string;
  title: string;
  username: string;
  iconUrl?: string;
  iconBgColor?: string;
  isFavorite?: boolean;
  lastUsed?: string;
  onCopy: () => void;
  onClick: () => void;
}

export function PasswordCard({
  title,
  username,
  iconBgColor = "bg-slate-100 dark:bg-slate-800",
  isFavorite = false,
  lastUsed = "Never",
  onCopy,
  onClick,
}: PasswordCardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl justify-between items-center hover:border-primary-500/50 transition-all cursor-pointer shadow-sm"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div
          className={`${iconBgColor} aspect-square rounded-lg size-14 flex items-center justify-center shrink-0`}
        >
          <span className="text-2xl font-bold text-slate-400 dark:text-slate-500">
            {title[0]?.toUpperCase() ?? "?"}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-slate-900 dark:text-white text-base font-bold truncate">
              {title}
            </p>
            {isFavorite && (
              <Star
                className="w-4 h-4 text-primary-500 fill-primary-500 shrink-0"
                aria-hidden
              />
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm truncate">
            {username}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Last used: {lastUsed}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className="text-slate-400 hover:text-primary-500 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          aria-label="Copy password"
        >
          <Copy className="w-5 h-5" />
        </button>
        <ChevronRight
          className="w-5 h-5 text-slate-300 dark:text-slate-600"
          aria-hidden
        />
      </div>
    </div>
  );
}
