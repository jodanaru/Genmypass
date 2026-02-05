import { ShieldAlert, ChevronRight } from "lucide-react";
import type { VaultEntry } from "@/stores/vault-store";

function maskUsername(username: string): string {
  const t = username.trim();
  if (!t) return "—";
  const atIndex = t.indexOf("@");
  if (atIndex !== -1) {
    const local = t.slice(0, atIndex);
    const domain = t.slice(atIndex + 1);
    const prefix = local.length >= 2 ? local.slice(0, 2) : local.slice(0, 1) || "";
    return `${prefix}***@${domain}`;
  }
  const prefix = t.length >= 2 ? t.slice(0, 2) : t.slice(0, 1) || "";
  return `${prefix}***`;
}

export interface AuditResultCardProps {
  entry: VaultEntry;
  breachCount: number;
  onChangePassword: () => void;
}

export function AuditResultCard({
  entry,
  breachCount,
  onChangePassword,
}: AuditResultCardProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <div className="flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10 shrink-0 w-10 h-10">
        <ShieldAlert className="w-5 h-5 text-red-500 dark:text-red-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 dark:text-white truncate">
          {entry.title || "Untitled"}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
          {maskUsername(entry.username ?? "")}
        </p>
        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
          Found in {breachCount.toLocaleString()} breach{breachCount !== 1 ? "es" : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={onChangePassword}
        className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold text-primary-500 hover:bg-primary-500/10 transition-colors"
      >
        Change
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
