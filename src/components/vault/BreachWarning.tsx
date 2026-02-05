import { AlertTriangle } from "lucide-react";

interface BreachWarningProps {
  breachCount: number;
  className?: string;
}

export function BreachWarning({ breachCount, className = "" }: BreachWarningProps) {
  return (
    <div
      role="alert"
      className={`flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-amber-800 dark:text-amber-200 ${className}`}
    >
      <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <p className="text-sm font-medium">
        This password appeared in {breachCount.toLocaleString()} data breach
        {breachCount !== 1 ? "es" : ""}.
      </p>
    </div>
  );
}
