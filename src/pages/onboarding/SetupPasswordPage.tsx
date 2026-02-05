import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle,
  Circle,
} from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding";
import { initSodium, deriveKeyWithNewSalt, encrypt, toBase64 } from "@/lib/crypto";
import {
  encryptRefreshToken,
  storeRefreshToken,
  saveVault,
  getAccessToken,
} from "@/lib/google-drive";
import { DEFAULT_USER_SETTINGS } from "@/stores/settings-store";
import { useAuthStore } from "@/stores/auth-store";
import { checkPasswordBreach } from "@/lib/hibp";
import { BreachWarning } from "@/components/vault";

interface PasswordState {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

const SYMBOL_REGEX = /[!@#$%^&*(),.?":{}|<>]/;

export default function SetupPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setMasterKey = useAuthStore((s) => s.setMasterKey);
  const [state, setState] = useState<PasswordState>({
    password: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breachResult, setBreachResult] = useState<{
    breached: boolean;
    count: number;
  } | null>(null);
  const [showZeroKnowledgeModal, setShowZeroKnowledgeModal] = useState(false);

  useEffect(() => {
    if (!state.password) {
      setBreachResult(null);
      return;
    }
    const timer = window.setTimeout(() => {
      checkPasswordBreach(state.password).then(setBreachResult);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [state.password]);

  const hasMinLength = state.password.length >= 12;
  const hasUpperAndLower =
    /[a-z]/.test(state.password) && /[A-Z]/.test(state.password);
  const hasNumber = /\d/.test(state.password);
  const hasSymbol = SYMBOL_REGEX.test(state.password);
  const passwordsMatch =
    state.password === state.confirmPassword && state.confirmPassword.length > 0;

  const allRequirementsMet =
    hasMinLength && hasUpperAndLower && hasNumber && hasSymbol;
  const canContinue = allRequirementsMet && passwordsMatch;

  const getStrength = (): number => {
    let strength = 0;
    if (hasMinLength) strength++;
    if (hasUpperAndLower) strength++;
    if (hasNumber) strength++;
    if (hasSymbol) strength++;
    return strength;
  };

  const strengthLabels: Record<number, string> = {
    0: t("onboarding.password.strengthEnter"),
    1: t("onboarding.password.strengthWeak"),
    2: t("onboarding.password.strengthFair"),
    3: t("onboarding.password.strengthGood"),
    4: t("onboarding.password.strengthStrong"),
  };

  const strengthColors = {
    bar: [
      "bg-gray-200 dark:bg-slate-700",
      "bg-red-500",
      "bg-yellow-500",
      "bg-lime-500",
      "bg-green-500",
    ],
    text: [
      "text-slate-400",
      "text-red-500",
      "text-yellow-500",
      "text-lime-500",
      "text-green-500",
    ],
  };

  const handleContinue = async () => {
    if (!canContinue || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      await initSodium();

      const { key: masterKey, salt } = deriveKeyWithNewSalt(state.password);

      localStorage.setItem("genmypass_salt", toBase64(salt));
      setMasterKey(masterKey);

      const tempRefresh = sessionStorage.getItem("genmypass_temp_refresh");
      if (tempRefresh) {
        const encryptedRefresh = await encryptRefreshToken(tempRefresh, masterKey);
        storeRefreshToken(encryptedRefresh);
        sessionStorage.removeItem("genmypass_temp_refresh");
      }

      const emptyVault = {
        version: 1,
        entries: [],
        folders: [],
        settings: DEFAULT_USER_SETTINGS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const vaultJson = JSON.stringify(emptyVault);
      const vaultBytes = new TextEncoder().encode(vaultJson);
      const { iv, tag, data } = await encrypt({
        key: masterKey,
        plaintext: vaultBytes,
      });

      const encryptedVault = JSON.stringify({
        salt: toBase64(salt),
        iv: toBase64(iv),
        tag: toBase64(tag),
        data: toBase64(data),
      });

      if (!getAccessToken()) {
        throw new Error("No hay sesión de Google Drive activa");
      }

      const fileId = await saveVault(encryptedVault);
      localStorage.setItem("genmypass_vault_file_id", fileId);
      localStorage.setItem("genmypass_setup_step", "password_created");
      sessionStorage.setItem("genmypass_just_setup", "true");

      navigate("/setup/security");
    } catch (err) {
      console.error("Error en setup:", err);
      setError(
        err instanceof Error
          ? err.message
          : t("onboarding.password.errorSetup")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] transition-colors duration-200">
      <header className="w-full py-8 px-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img
              alt="Genmypass"
              className="w-8 h-8"
              src="/logo.png"
            />
            <span className="font-bold text-xl text-slate-800 dark:text-white">
              Genmypass
            </span>
          </div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("onboarding.stepOf", { current: 2, total: 4 })}
          </span>
        </div>
        <OnboardingProgress currentStep={2} totalSteps={4} />
      </header>

      <main className="flex-1 flex justify-center py-6 px-4 pb-20">
        <div className="max-w-[520px] w-full flex flex-col">
          <div className="pb-6 pt-2">
            <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight">
              {t("onboarding.password.title")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              {t("onboarding.password.subtitle")}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Warning panel */}
          <div className="mb-8">
            <div className="flex flex-col items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-900/30 p-5">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500 font-bold">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-base leading-tight">
                  {t("onboarding.password.warningTitle")}
                </p>
              </div>
              <p className="text-yellow-800/80 dark:text-yellow-400/80 text-sm leading-relaxed">
                {t("onboarding.password.warningDesc")}
              </p>
              <button
                type="button"
                onClick={() => setShowZeroKnowledgeModal(true)}
                className="text-sm font-bold leading-normal tracking-tight flex items-center gap-1 text-primary-500 hover:underline mt-1"
              >
                {t("onboarding.password.learnZeroKnowledge")}
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Master Password */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-900 dark:text-white text-sm font-semibold leading-normal">
                {t("onboarding.password.masterPassword")}
              </label>
              <div className="relative">
                <input
                  type={state.showPassword ? "text" : "password"}
                  value={state.password}
                  onChange={(e) =>
                    setState((s) => ({ ...s, password: e.target.value }))
                  }
                  placeholder={t("onboarding.password.placeholder")}
                  className="w-full h-14 px-4 pr-12 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setState((s) => ({ ...s, showPassword: !s.showPassword }))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500 transition-colors"
                  aria-label={state.showPassword ? t("onboarding.password.ariaHidePassword") : t("onboarding.password.ariaShowPassword")}
                >
                  {state.showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {/* Strength bar */}
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3, 4].map((level) => {
                  const strength = getStrength();
                  return (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        strength >= level
                          ? strengthColors.bar[strength]
                          : strengthColors.bar[0]
                      }`}
                    />
                  );
                })}
              </div>
              <p
                className={`text-xs font-medium mt-1 ${
                  strengthColors.text[getStrength()]
                }`}
              >
                {strengthLabels[getStrength()]}
              </p>
              {breachResult?.breached && (
                <BreachWarning breachCount={breachResult.count} className="mt-3" />
              )}
            </div>

            {/* Requirements checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
              {[
                { met: hasMinLength, label: t("onboarding.password.requirementChars") },
                { met: hasUpperAndLower, label: t("onboarding.password.requirementUpperLower") },
                { met: hasNumber, label: t("onboarding.password.requirementNumber") },
                { met: hasSymbol, label: t("onboarding.password.requirementSymbol") },
              ].map((req, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm"
                >
                  {req.met ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-primary-500" />
                  ) : (
                    <Circle className="w-4 h-4 shrink-0 text-slate-300 dark:text-slate-600" />
                  )}
                  <span
                    className={
                      req.met
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-400 dark:text-slate-500"
                    }
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Confirm Master Password */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-900 dark:text-white text-sm font-semibold leading-normal">
                {t("onboarding.password.confirmPassword")}
              </label>
              <div className="relative">
                <input
                  type={state.showConfirmPassword ? "text" : "password"}
                  value={state.confirmPassword}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder={t("onboarding.password.placeholderConfirm")}
                  className="w-full h-14 px-4 pr-12 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      showConfirmPassword: !s.showConfirmPassword,
                    }))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500 transition-colors"
                  aria-label={
                    state.showConfirmPassword
                      ? t("onboarding.password.ariaHidePassword")
                      : t("onboarding.password.ariaShowPassword")
                  }
                >
                  {state.showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Continue button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue || isProcessing}
                className={`w-full font-bold py-4 rounded-xl text-lg transition-all shadow-lg ${
                  canContinue && !isProcessing
                    ? "bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/20 cursor-pointer"
                    : "bg-primary-500/50 text-white cursor-not-allowed"
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin w-5 h-5"
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
                    {t("onboarding.password.creatingVault")}
                  </span>
                ) : (
                  t("onboarding.password.continueToVault")
                )}
              </button>
              <p className="text-center text-slate-500 dark:text-slate-400 text-xs mt-4 leading-relaxed">
                {t("onboarding.password.footerNote")}
                <br />
                {t("onboarding.password.footerEncrypts")}
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 px-6 text-center text-slate-400 dark:text-slate-500 text-xs">
        <p>© 2024 Genmypass. {t("landing.featureEncryption")}.</p>
      </footer>

      {/* Zero-knowledge modal */}
      {showZeroKnowledgeModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="zero-knowledge-modal-title"
          onClick={() => setShowZeroKnowledgeModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="zero-knowledge-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-white mb-4"
            >
              {t("onboarding.password.learnZeroKnowledgeModal.title")}
            </h3>
            <div className="space-y-3 text-slate-600 dark:text-slate-400 text-sm mb-6">
              <p>{t("onboarding.password.learnZeroKnowledgeModal.paragraph1")}</p>
              <p>{t("onboarding.password.learnZeroKnowledgeModal.paragraph2")}</p>
              <p>{t("onboarding.password.learnZeroKnowledgeModal.paragraph3")}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowZeroKnowledgeModal(false)}
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
