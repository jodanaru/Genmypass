import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HelpCircle, ShieldCheck } from "lucide-react";

const SECURITY_MODE_KEY = "genmypass_security_mode";

export type SecurityMode = "password-only" | "dual-key";

export default function SetupSecurityModePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<SecurityMode>("password-only");
  const [showDifferenceModal, setShowDifferenceModal] = useState(false);

  const handleContinue = () => {
    localStorage.setItem(SECURITY_MODE_KEY, selectedMode);

    if (selectedMode === "password-only") {
      navigate("/vault");
    } else {
      navigate("/setup/secret-key");
    }
  };

  const progressPercent = Math.round((3 / 4) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <img alt="Genmypass" className="w-8 h-8" src="/logo.png" />
          <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">
            Genmypass
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center py-12 px-4 pb-20">
        <div className="w-full max-w-[640px] flex flex-col">
          {/* Progress bar */}
          <div className="flex flex-col gap-3 mb-8 w-full">
            <div className="flex gap-6 justify-between items-end">
              <p className="text-slate-900 dark:text-white text-base font-medium">
                {t("onboarding.security.stepOf")}
              </p>
              <p className="text-slate-900 dark:text-white text-sm font-normal">
                {progressPercent}%
              </p>
            </div>
            <div className="rounded-full bg-slate-200 dark:bg-slate-800 h-2 w-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">
              {t("onboarding.security.securityConfig")}
            </p>
          </div>

          {/* Headline */}
          <div className="mb-10 text-center">
            <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight mb-2">
              {t("onboarding.security.chooseLevel")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              {t("onboarding.security.selectModel")}
            </p>
          </div>

          {/* Security options */}
          <div className="flex flex-col gap-4 mb-8">
            {/* Option 1: Password Only (Recommended) */}
            <button
              type="button"
              onClick={() => setSelectedMode("password-only")}
              className={`relative group cursor-pointer text-left w-full p-6 rounded-xl transition-all shadow-sm border-2 ${
                selectedMode === "password-only"
                  ? "border-primary-500 bg-primary-500/5 dark:bg-primary-500/10"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-500 text-white mb-2 w-fit">
                    {t("onboarding.security.recommended")}
                  </span>
                  <h3 className="text-slate-900 dark:text-white text-lg font-bold">
                    {t("onboarding.security.passwordOnly")}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-[85%]">
                    {t("onboarding.security.passwordOnlyDesc")}
                  </p>
                </div>
                <div className="flex items-center justify-center size-6 rounded-full border-2 border-primary-500 shrink-0 mt-0.5">
                  {selectedMode === "password-only" && (
                    <div className="size-3 rounded-full bg-primary-500" />
                  )}
                </div>
              </div>
            </button>

            {/* Option 2: Dual-Key */}
            <button
              type="button"
              onClick={() => setSelectedMode("dual-key")}
              className={`relative group cursor-pointer text-left w-full p-6 rounded-xl transition-all shadow-sm border-2 ${
                selectedMode === "dual-key"
                  ? "border-primary-500 bg-primary-500/5 dark:bg-primary-500/10"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-2 w-fit">
                    {t("onboarding.security.maximumSecurity")}
                  </span>
                  <h3 className="text-slate-900 dark:text-white text-lg font-bold">
                    {t("onboarding.security.dualKey")}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-[85%]">
                    {t("onboarding.security.dualKeyDesc")}
                  </p>
                </div>
                <div
                  className={`flex items-center justify-center size-6 rounded-full border-2 shrink-0 mt-0.5 ${
                    selectedMode === "dual-key"
                      ? "border-primary-500"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {selectedMode === "dual-key" && (
                    <div className="size-3 rounded-full bg-primary-500" />
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Help link & action */}
          <div className="flex flex-col items-center gap-6">
            <button
              type="button"
              onClick={() => setShowDifferenceModal(true)}
              className="flex items-center gap-2 text-primary-500 text-sm font-medium hover:underline group"
            >
              <HelpCircle className="w-[18px] h-[18px] shrink-0" aria-hidden />
              {t("onboarding.security.whatsDifference")}
            </button>

            {/* Continue button */}
            <button
              type="button"
              onClick={handleContinue}
              className="w-full max-w-sm py-3.5 px-6 bg-primary-500 text-white font-semibold rounded-lg shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-colors focus:ring-4 focus:ring-primary-500/30"
            >
              {t("onboarding.security.continueToVault")}
            </button>
          </div>

          {/* Whats difference modal */}
          {showDifferenceModal && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="whats-difference-modal-title"
              onClick={() => setShowDifferenceModal(false)}
            >
              <div
                className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <h3
                  id="whats-difference-modal-title"
                  className="text-lg font-bold text-slate-900 dark:text-white mb-4"
                >
                  {t("onboarding.security.whatsDifferenceModal.title")}
                </h3>
                <div className="space-y-4 text-sm mb-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                      {t("onboarding.security.whatsDifferenceModal.passwordOnlyTitle")}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      {t("onboarding.security.whatsDifferenceModal.passwordOnlyDesc")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                      {t("onboarding.security.whatsDifferenceModal.dualKeyTitle")}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      {t("onboarding.security.whatsDifferenceModal.dualKeyDesc")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDifferenceModal(false)}
                  className="w-full py-3 px-4 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          )}

          {/* Zero-Knowledge banner */}
          <div className="mt-12 p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 flex items-center gap-4">
            <div className="flex-shrink-0 size-12 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center text-primary-500 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t("onboarding.security.zeroKnowledgeTitle")}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                {t("onboarding.security.zeroKnowledgeDesc")}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
