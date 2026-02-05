import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle,
  Circle,
  Info,
  Lock,
} from "lucide-react";
import {
  initSodium,
  deriveKey,
  deriveKeyWithNewSalt,
  encrypt,
  toBase64,
  fromBase64,
  timingSafeEqual,
} from "@/lib/crypto";
import { getSettingsForVault } from "@/stores/settings-store";
import { useAuthStore } from "@/stores/auth-store";
import { useVaultStore } from "@/stores/vault-store";
import { saveVault } from "@/lib/google-drive";
import {
  getStoredRefreshToken,
  decryptRefreshToken,
  encryptRefreshToken,
  storeRefreshToken,
  startAutoRefresh,
} from "@/lib/google-drive";

const SYMBOL_REGEX = /[!@#$%^&*(),.?":{}|<>]/;
const SECURITY_MODE_KEY = "genmypass_security_mode";

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const masterKey = useAuthStore((s) => s.masterKey);
  const setMasterKey = useAuthStore((s) => s.setMasterKey);
  const setVault = useVaultStore((s) => s.setVault);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReEncrypting, setIsReEncrypting] = useState(false);
  const currentPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    currentPasswordRef.current?.focus();
  }, []);

  const hasMinLength = newPassword.length >= 12;
  const hasUpperAndLower =
    /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = SYMBOL_REGEX.test(newPassword);
  const newRequirementsMet =
    hasMinLength && hasUpperAndLower && hasNumber && hasSymbol;
  const passwordsMatch =
    newPassword === confirmPassword && confirmPassword.length > 0;

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

  const isDualKeyMode =
    typeof localStorage !== "undefined" &&
    localStorage.getItem(SECURITY_MODE_KEY) === "dual-key";

  const canSubmit =
    currentPassword.trim().length > 0 &&
    newRequirementsMet &&
    passwordsMatch &&
    !isProcessing;

  const handleCancel = () => navigate("/settings");

  const handleSubmit = async () => {
    if (!canSubmit || !masterKey) return;

    const currentFileId = useVaultStore.getState().fileId;
    const currentVault = useVaultStore.getState().vault;
    const salt =
      useVaultStore.getState().vaultFileSalt ??
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("genmypass_salt")
        : null);

    if (!currentVault || !currentFileId) {
      setError(t("settings.changePassword.errorVaultNotFound"));
      return;
    }
    if (!salt) {
      setError(t("settings.changePassword.errorNoConfig"));
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await initSodium();
      const { key: derivedKey } = deriveKey(
        currentPassword,
        fromBase64(salt)
      );
      if (!timingSafeEqual(derivedKey, masterKey)) {
        setError(t("settings.changePassword.errorWrongPassword"));
        return;
      }

      setIsReEncrypting(true);

      const { key: newKey, salt: newSalt } = deriveKeyWithNewSalt(newPassword);
      const payload = {
        ...currentVault,
        settings: getSettingsForVault(),
      };
      const vaultJson = JSON.stringify(payload);
      const vaultBytes = new TextEncoder().encode(vaultJson);
      const { iv, tag, data } = await encrypt({
        key: newKey,
        plaintext: vaultBytes,
      });

      const encryptedVault = JSON.stringify({
        salt: toBase64(newSalt),
        iv: toBase64(iv),
        tag: toBase64(tag),
        data: toBase64(data),
      });

      await saveVault(encryptedVault, currentFileId);

      if (typeof localStorage !== "undefined") {
        localStorage.setItem("genmypass_salt", toBase64(newSalt));
      }
      setVault(currentVault, currentFileId, toBase64(newSalt));

      const encryptedRefresh = getStoredRefreshToken();
      if (encryptedRefresh) {
        try {
          const refreshToken = await decryptRefreshToken(
            encryptedRefresh,
            masterKey
          );
          const newEncryptedRefresh = await encryptRefreshToken(
            refreshToken,
            newKey
          );
          storeRefreshToken(newEncryptedRefresh);
        } catch {
          // Si falla (ej. token corrupto), seguimos; el usuario puede reconectar
        }
      }

      setMasterKey(newKey);
      startAutoRefresh(newKey);

      navigate("/settings", { replace: true });
    } catch (err) {
      console.error("Change password error:", err);
      setError(
        err instanceof Error
          ? err.message
          : t("settings.changePassword.errorSave")
      );
    } finally {
      setIsProcessing(false);
      setIsReEncrypting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label={t("settings.changePassword.ariaBack")}
            >
              <span className="sr-only">{t("common.cancel")}</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {t("settings.changePassword.title")}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {t("common.cancel")}
          </button>
        </div>
      </header>

      <main className="max-w-[640px] mx-auto py-10 px-4 pb-24 flex flex-col gap-6">
        {/* Security Warning */}
        <div className="p-5 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900/30 flex flex-col gap-1">
          <p className="text-yellow-800 dark:text-yellow-200 text-base font-bold leading-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {t("settings.changePassword.securityWarning")}
          </p>
          <p className="text-yellow-700 dark:text-yellow-300/80 text-sm font-normal leading-normal">
            {t("settings.changePassword.securityWarningDesc")}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Current Master Password */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="current-password"
              className="text-slate-900 dark:text-slate-200 text-sm font-semibold"
            >
              {t("settings.changePassword.currentPassword")}
            </label>
            <div className="flex w-full items-stretch">
              <input
                ref={currentPasswordRef}
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setError(null);
                }}
                autoComplete="current-password"
                placeholder={t("settings.changePassword.placeholderCurrent")}
                className="flex-1 rounded-lg rounded-r-none border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((s) => !s)}
                className="flex items-center justify-center px-4 border border-l-0 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-r-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                aria-label={showCurrent ? t("entry.ariaHidePassword") : t("entry.ariaShowPassword")}
              >
                {showCurrent ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Master Password */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="new-password"
              className="text-slate-900 dark:text-slate-200 text-sm font-semibold"
            >
              {t("settings.changePassword.newPassword")}
            </label>
            <div className="flex w-full items-stretch">
              <input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder={t("settings.changePassword.placeholderNew")}
                className="flex-1 rounded-lg rounded-r-none border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                className="flex items-center justify-center px-4 border border-l-0 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-r-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                aria-label={showNew ? t("entry.ariaHidePassword") : t("entry.ariaShowPassword")}
              >
                {showNew ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="mt-2">
              <div className="flex gap-1 h-1.5 w-full">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 rounded-full transition-colors ${
                      getStrength() >= level
                        ? strengthColors.bar[getStrength()]
                        : strengthColors.bar[0]
                    }`}
                  />
                ))}
              </div>
              <p
                className={`text-xs font-medium mt-1.5 ${
                  strengthColors.text[getStrength()]
                }`}
              >
                {strengthLabels[getStrength()]}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { met: hasMinLength, label: t("onboarding.password.requirementChars") },
                { met: hasUpperAndLower, label: t("onboarding.password.requirementUpperLower") },
                { met: hasNumber, label: t("entry.numbers") },
                { met: hasSymbol, label: t("entry.symbols") },
              ].map((req, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs"
                >
                  {req.met ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400" />
                  ) : (
                    <Circle className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
                  )}
                  <span
                    className={
                      req.met
                        ? "text-green-600 dark:text-green-400"
                        : "text-slate-500 dark:text-slate-400"
                    }
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="confirm-password"
              className="text-slate-900 dark:text-slate-200 text-sm font-semibold"
            >
              {t("settings.changePassword.confirmPassword")}
            </label>
            <div className="flex w-full items-stretch">
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder={t("settings.changePassword.placeholderConfirm")}
                className="flex-1 rounded-lg rounded-r-none border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="flex items-center justify-center px-4 border border-l-0 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-r-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                aria-label={showConfirm ? t("entry.ariaHidePassword") : t("entry.ariaShowPassword")}
              >
                {showConfirm ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Dual-key info box */}
          {isDualKeyMode && (
            <div className="p-4 rounded-lg bg-primary-500/10 border border-primary-500/20 flex gap-3">
              <Info className="w-5 h-5 shrink-0 text-primary-500" />
              <div className="flex-1 min-w-0">
                <p className="text-primary-600 dark:text-primary-400 text-sm font-bold">
                  {t("settings.changePassword.dualKeyTitle")}
                </p>
                <p className="text-primary-600/80 dark:text-primary-400/80 text-xs leading-relaxed mt-0.5">
                  {t("settings.changePassword.dualKeyDesc")}
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5" />
            {t("settings.changePassword.submit")}
          </button>
        </div>
      </main>

      {/* Re-encrypting overlay */}
      {isReEncrypting && (
        <div
          className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full">
            <div className="relative flex items-center justify-center">
              <svg
                className="w-24 h-24 animate-spin text-primary-500"
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
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {t("settings.changePassword.reEncrypting")}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t("settings.changePassword.reEncryptingDesc")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
