import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import {
  classifyApiError,
  getApiErrorMessageKey,
  type ApiErrorClassification,
} from "@/lib/api-errors";
import { useVault } from "@/hooks/useVault";
import { useSettingsStore } from "@/stores/settings-store";
import { checkPasswordBreach } from "@/lib/hibp";
import { AuditResultCard } from "@/components/settings/AuditResultCard";

interface AuditResult {
  entryId: string;
  breached: boolean;
  count: number;
}

type AuditStatus = "idle" | "scanning" | "results";

interface AuditProgress {
  current: number;
  total: number;
}

const RATE_LIMIT_MS = 100;

export default function SecurityAuditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { entries } = useVault();
  const setLastSecurityAudit = useSettingsStore((s) => s.setLastSecurityAudit);

  const [status, setStatus] = useState<AuditStatus>("idle");
  const [progress, setProgress] = useState<AuditProgress | null>(null);
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [auditApiError, setAuditApiError] =
    useState<ApiErrorClassification | null>(null);
  const [secureSectionCollapsed, setSecureSectionCollapsed] = useState(true);
  const cancelledRef = useRef(false);

  const entriesWithPassword = entries.filter((e) => (e.password ?? "").length > 0);

  const runAudit = useCallback(async () => {
    if (entriesWithPassword.length === 0) return;
    setStatus("scanning");
    setAuditApiError(null);
    cancelledRef.current = false;
    const results: AuditResult[] = [];
    let lastErrorClassification: ApiErrorClassification | null = null;

    for (let i = 0; i < entriesWithPassword.length; i++) {
      if (cancelledRef.current) break;

      setProgress({ current: i + 1, total: entriesWithPassword.length });
      const entry = entriesWithPassword[i]!;
      const result = await checkPasswordBreach(entry.password ?? "");
      results.push({
        entryId: entry.id,
        breached: result.breached,
        count: result.count,
      });
      if (result.error) {
        lastErrorClassification = classifyApiError(null, result.status);
      }
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    }

    setAuditResults(results);
    setAuditApiError(lastErrorClassification);
    setProgress(null);
    setStatus("results");
    if (!cancelledRef.current) {
      setLastSecurityAudit(new Date().toISOString());
    }
  }, [entriesWithPassword, setLastSecurityAudit]);

  const handleCancelScan = () => {
    cancelledRef.current = true;
  };

  const handleScanAgain = () => {
    setStatus("idle");
    setAuditResults([]);
    setAuditApiError(null);
  };

  const compromised = auditResults.filter((r) => r.breached);
  const secure = auditResults.filter((r) => !r.breached);
  const total = auditResults.length;
  const safePercent = total > 0 ? Math.round(((total - compromised.length) / total) * 100) : 100;
  const scoreColorClass =
    safePercent >= 85
      ? "text-green-600 dark:text-green-400"
      : safePercent >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";
  const scoreBarClass =
    safePercent >= 85
      ? "bg-green-500"
      : safePercent >= 50
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {t("settings.securityAudit")}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-8 px-6 space-y-6 pb-24">
        {status === "idle" && (
          <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-wider px-6 pb-2 pt-6 uppercase">
              {t("settings.audit.checkForBreaches")}
            </h3>
            <div className="px-6 py-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10 shrink-0 w-12 h-12">
                  <ShieldAlert className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-medium">
                    {t("settings.audit.checkBreachedTitle")}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    {t("settings.audit.checkBreachedDesc")}
                  </p>
                  {entriesWithPassword.length === 0 && (
                    <p className="text-amber-600 dark:text-amber-400 text-sm mt-2 font-medium">
                      {t("settings.audit.noPasswordsToScan")}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={runAudit}
                disabled={entriesWithPassword.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ShieldCheck className="w-5 h-5" />
                {t("settings.audit.startScan")}
              </button>
            </div>
          </section>
        )}

        {status === "scanning" && progress && (
          <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="px-6 py-6 space-y-4">
              <p className="text-slate-900 dark:text-white font-medium">
                {t("settings.audit.checkingProgress", {
                  current: progress.current,
                  total: progress.total,
                })}
              </p>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleCancelScan}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <X className="w-5 h-5" />
                {t("settings.audit.cancelScan")}
              </button>
            </div>
          </section>
        )}

        {status === "results" && (
          <>
            {auditApiError && (
              <section
                role="alert"
                className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex flex-col gap-2"
              >
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {t(getApiErrorMessageKey(auditApiError.type))}
                </p>
                {auditApiError.retryable && (
                  <button
                    type="button"
                    onClick={() => runAudit()}
                    className="text-left font-semibold underline hover:no-underline text-red-600 dark:text-red-400 text-sm"
                  >
                    {t("common.retry")}
                  </button>
                )}
              </section>
            )}
            <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-wider px-6 pb-2 pt-6 uppercase">
                {t("settings.audit.results")}
              </h3>
              <div className="px-6 py-6 space-y-4">
                <p className="text-slate-900 dark:text-white">
                  {t("settings.audit.compromisedOfTotal", {
                    count: total,
                    compromised: compromised.length,
                    total,
                  })}
                </p>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${scoreColorClass}`}>
                    {t("settings.audit.securityScore", { percent: safePercent })}
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${scoreBarClass} transition-all duration-300`}
                    style={{ width: `${safePercent}%` }}
                  />
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  {compromised.length > 0 && (
                    <p className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {t("settings.audit.needsAttention", {
                        count: compromised.length,
                      })}
                    </p>
                  )}
                  <p className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {t("settings.audit.secureCount", { count: secure.length })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleScanAgain}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {t("settings.audit.scanAgain")}
                </button>
              </div>
            </section>

            {compromised.length > 0 && (
              <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-wider px-6 pb-2 pt-6 uppercase">
                  {t("settings.audit.compromisedCount", {
                    count: compromised.length,
                  })}
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {compromised.map((r) => {
                    const entry = entries.find((e) => e.id === r.entryId);
                    if (!entry) return null;
                    return (
                      <AuditResultCard
                        key={r.entryId}
                        entry={entry}
                        breachCount={r.count}
                        onChangePassword={() =>
                          navigate(`/entry/${r.entryId}/edit`)
                        }
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {secure.length > 0 && (
              <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    setSecureSectionCollapsed((c) => !c)
                  }
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-wider uppercase">
                    {t("settings.audit.secureSection", { count: secure.length })}
                  </span>
                  {secureSectionCollapsed ? (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                {!secureSectionCollapsed && (
                  <div className="border-t border-slate-100 dark:border-slate-700">
                    {secure.map((r) => {
                      const entry = entries.find((e) => e.id === r.entryId);
                      if (!entry) return null;
                      return (
                        <div
                          key={r.entryId}
                          className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                        >
                          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                          <span className="font-medium text-slate-900 dark:text-white truncate">
                            {entry.title || t("settings.audit.untitled")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
