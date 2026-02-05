import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  KeyRound,
  AlertTriangle,
  Copy,
  Check,
  Download,
  Printer,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateSecretKey(): string {
  const segments = Array.from({ length: 7 }, () =>
    Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
  );
  return `VG-${segments.join("-")}`;
}

interface SecretKeyState {
  secretKey: string;
  hasConfirmed: boolean;
  hasCopied: boolean;
  hasDownloaded: boolean;
}

const COPY_FEEDBACK_MS = 2000;

type HelpModal = "whereToStore" | "whatIfLose" | null;

export default function SetupSecretKeyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = useState<SecretKeyState>({
    secretKey: "",
    hasConfirmed: false,
    hasCopied: false,
    hasDownloaded: false,
  });
  const [helpModal, setHelpModal] = useState<HelpModal>(null);

  useEffect(() => {
    setState((s) => ({ ...s, secretKey: generateSecretKey() }));
  }, []);

  const canComplete = state.hasConfirmed;

  const handleCopy = async () => {
    if (!state.secretKey) return;
    await navigator.clipboard.writeText(state.secretKey);
    setState((s) => ({ ...s, hasCopied: true }));
    setTimeout(
      () => setState((s) => ({ ...s, hasCopied: false })),
      COPY_FEEDBACK_MS
    );
  };

  const handleDownload = () => {
    if (!state.secretKey) return;
    const content = `GENMYPASS SECRET KEY
====================

Your Secret Key: ${state.secretKey}

IMPORTANT:
- Store this file in a safe place (physical safe, offline storage)
- You need this key + your master password to access your vault on new devices
- We do NOT store a copy of this key - if you lose it, your data cannot be recovered

Generated: ${new Date().toISOString()}
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "genmypass-secret-key.txt";
    a.click();
    URL.revokeObjectURL(url);
    setState((s) => ({ ...s, hasDownloaded: true }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleComplete = () => {
    if (!canComplete) return;
    localStorage.setItem("genmypass_setup_complete", "true");
    localStorage.setItem("genmypass_has_secret_key", "true");
    navigate("/vault");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] transition-colors duration-200">
      <header className="w-full py-8 px-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img alt="Genmypass" className="w-8 h-8" src="/logo.png" />
            <span className="font-bold text-xl text-slate-800 dark:text-white">
              Genmypass
            </span>
          </div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("onboarding.stepOf", { current: 4, total: 4 })}
          </span>
        </div>
        <OnboardingProgress currentStep={4} totalSteps={4} />
      </header>

      <main className="flex-1 flex flex-col items-center py-6 px-4 pb-20">
        <div className="max-w-[640px] w-full flex flex-col gap-6">
          {/* Icon + headline */}
          <div className="flex flex-col items-center pt-4">
            <div className="mb-4 flex items-center justify-center size-20 rounded-full bg-primary-500/10 text-primary-500">
              <KeyRound className="w-10 h-10" />
            </div>
            <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight text-center">
              {t("onboarding.secretKey.title")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-center mt-2 max-w-md">
              {t("onboarding.secretKey.subtitle")}
            </p>
          </div>

          {/* Critical warning */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 p-5">
            <div className="text-red-600 dark:text-red-500 shrink-0">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-red-800 dark:text-red-400 text-base font-bold leading-tight">
                {t("onboarding.secretKey.criticalTitle")}
              </p>
              <p className="text-red-700 dark:text-red-300/80 text-sm">
                {t("onboarding.secretKey.criticalDesc")}
              </p>
            </div>
          </div>

          {/* Secret key card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 block">
              {t("onboarding.secretKey.yourSecretKey")}
            </label>
            <div className="relative">
              <div className="bg-slate-50 dark:bg-slate-950 font-mono text-sm sm:text-base break-all p-4 pr-12 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed text-slate-900 dark:text-slate-300 select-all">
                {state.secretKey || t("onboarding.secretKey.generating")}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!state.secretKey}
                className="absolute top-2 right-2 p-2 rounded text-slate-400 hover:text-primary-500 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                aria-label={t("onboarding.secretKey.copyAria")}
              >
                {state.hasCopied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!state.secretKey}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary-500 text-white text-sm font-bold transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5 shrink-0" />
                <span>{t("onboarding.secretKey.downloadTxt")}</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 rounded-lg h-12 px-6 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Printer className="w-5 h-5 shrink-0" />
                <span>{t("onboarding.secretKey.print")}</span>
              </button>
            </div>
          </div>

          {/* Checkbox + Complete */}
          <div className="flex flex-col gap-6 pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="pt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={state.hasConfirmed}
                  onChange={(e) =>
                    setState((s) => ({ ...s, hasConfirmed: e.target.checked }))
                  }
                  className="size-5 rounded border-slate-300 dark:border-slate-700 text-primary-500 focus:ring-primary-500 dark:bg-slate-900"
                />
              </div>
              <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300 select-none group-hover:text-primary-500 transition-colors">
                {t("onboarding.secretKey.savedCheckbox")}
              </span>
            </label>
            <button
              type="button"
              onClick={handleComplete}
              disabled={!canComplete}
              className={`flex w-full items-center justify-center rounded-xl h-14 px-4 text-lg font-bold transition-all ${
                canComplete
                  ? "bg-primary-500 text-white hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/20 cursor-pointer"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
              }`}
            >
              {t("onboarding.secretKey.completeSetup")}
            </button>
          </div>

          {/* Footer help links */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 mt-4 pb-4">
            <button
              type="button"
              onClick={() => setHelpModal("whereToStore")}
              className="flex items-center gap-1.5 text-primary-500 text-sm font-medium hover:underline"
            >
              <HelpCircle className="w-5 h-5 shrink-0" />
              {t("onboarding.secretKey.whereToStore")}
            </button>
            <button
              type="button"
              onClick={() => setHelpModal("whatIfLose")}
              className="flex items-center gap-1.5 text-red-500/80 text-sm font-medium hover:underline"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {t("onboarding.secretKey.whatIfLose")}
            </button>
          </div>
        </div>
      </main>

      {/* Where to store modal */}
      {helpModal === "whereToStore" && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="where-to-store-modal-title"
          onClick={() => setHelpModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="where-to-store-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-white mb-4"
            >
              {t("onboarding.secretKey.whereToStoreModal.title")}
            </h3>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400 mb-6">
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {t("onboarding.secretKey.whereToStoreModal.recommended")}
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-1">
                <li>{t("onboarding.secretKey.whereToStoreModal.recommended1")}</li>
                <li>{t("onboarding.secretKey.whereToStoreModal.recommended2")}</li>
                <li>{t("onboarding.secretKey.whereToStoreModal.recommended3")}</li>
              </ul>
              <p className="font-medium text-slate-700 dark:text-slate-300 pt-1">
                {t("onboarding.secretKey.whereToStoreModal.avoid")}
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>{t("onboarding.secretKey.whereToStoreModal.avoid1")}</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setHelpModal(null)}
              className="w-full py-3 px-4 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}

      {/* What if I lose it modal */}
      {helpModal === "whatIfLose" && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="what-if-lose-modal-title"
          onClick={() => setHelpModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="what-if-lose-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-white mb-4"
            >
              {t("onboarding.secretKey.whatIfLoseModal.title")}
            </h3>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400 mb-6">
              <p>{t("onboarding.secretKey.whatIfLoseModal.p1")}</p>
              <p>{t("onboarding.secretKey.whatIfLoseModal.p2")}</p>
              <p>{t("onboarding.secretKey.whatIfLoseModal.p3")}</p>
            </div>
            <button
              type="button"
              onClick={() => setHelpModal(null)}
              className="w-full py-3 px-4 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
