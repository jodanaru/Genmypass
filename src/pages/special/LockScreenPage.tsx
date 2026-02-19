import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock, Eye, EyeOff, Shield } from "lucide-react";
import {
  classifyApiError,
  getApiErrorMessageKey,
  type ApiErrorClassification,
} from "@/lib/api-errors";
import { useAuthStore } from "@/stores/auth-store";
import {
  getCurrentProvider,
  getAccessToken,
  getStoredRefreshToken,
  setTokens,
  startAutoRefresh,
  tryRestoreWithRefreshToken,
  encryptRefreshToken,
  storeRefreshToken,
} from "@/lib/cloud-storage";
import {
  initSodium,
  deriveKey,
  decrypt,
  fromBase64,
} from "@/lib/crypto";

const LOCK_NO_TOKEN_KEY = "lock.noToken";
const LOCK_CONFIG_NOT_FOUND_KEY = "lock.configNotFound";
const LOCK_VAULT_NOT_FOUND_KEY = "lock.vaultNotFound";
const LOCK_VAULT_GONE_KEY = "lock.vaultGone";
const LOCK_WRONG_PASSWORD_KEY = "lock.wrongPasswordOrError";

interface EncryptedVault {
  salt?: string;
  iv: string;
  tag: string;
  data: string;
}

function clearVaultState() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem("genmypass_vault_file_id");
  localStorage.removeItem("genmypass_salt");
}

const LOCK_ERROR_KEYS = [
  LOCK_NO_TOKEN_KEY,
  LOCK_CONFIG_NOT_FOUND_KEY,
  LOCK_VAULT_NOT_FOUND_KEY,
  LOCK_VAULT_GONE_KEY,
  LOCK_WRONG_PASSWORD_KEY,
];

export default function LockScreenPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setMasterKey = useAuthStore((s) => s.setMasterKey);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorClassification, setErrorClassification] =
    useState<ApiErrorClassification | null>(null);
  const [needsSetupAgain, setNeedsSetupAgain] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback((attempts: number) => {
    const delay = Math.min(Math.pow(2, attempts), 30);
    setCooldownSeconds(delay);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const needsReconnect = error === LOCK_NO_TOKEN_KEY;
  const errorDisplay = errorClassification
    ? t(getApiErrorMessageKey(errorClassification.type))
    : error && LOCK_ERROR_KEYS.includes(error)
      ? t(error)
      : error;

  useEffect(() => {
    const fileId = localStorage.getItem("genmypass_vault_file_id");
    if (!fileId) {
      navigate("/", { replace: true });
      return;
    }
    // Solo mostrar error de reconexión si NO hay access token Y TAMPOCO hay
    // refresh token (cifrado o temporal). Si hay algún refresh token disponible,
    // podremos restaurar la sesión cuando el usuario introduzca su contraseña.
    const hasRefreshToken =
      !!getStoredRefreshToken() ||
      !!localStorage.getItem("genmypass_temp_refresh");
    if (fileId && !getAccessToken() && !hasRefreshToken) {
      setError(LOCK_NO_TOKEN_KEY);
    }
  }, [navigate]);

  const handleReconnect = () => {
    setError(null);
    setErrorClassification(null);
    navigate("/connect", { replace: true });
  };

  const handleUnlock = async () => {
    if (!password.trim() || isUnlocking) return;

    setIsUnlocking(true);
    setError(null);
    setErrorClassification(null);

    try {
      const fileId = localStorage.getItem("genmypass_vault_file_id");
      if (!fileId) {
        clearVaultState();
        setNeedsSetupAgain(true);
        setError(LOCK_VAULT_NOT_FOUND_KEY);
        return;
      }

      await initSodium();
      const provider = getCurrentProvider();
      if (!provider) {
        setError(LOCK_NO_TOKEN_KEY);
        return;
      }

      // Derivar la clave primero para poder descifrar el refresh token si es necesario
      const saltBase64 = localStorage.getItem("genmypass_salt");
      let key: Uint8Array | null = null;

      if (saltBase64) {
        const salt = fromBase64(saltBase64);
        ({ key } = deriveKey(password, salt));
      }

      // Si no hay access token, intentar restaurar la sesión
      if (!getAccessToken()) {
        let restored = false;

        // 1. Intentar con el refresh token cifrado en localStorage (ert)
        if (key) {
          restored = await tryRestoreWithRefreshToken(key, provider);
        }

        // 2. Si falló, intentar con el refresh token temporal sin cifrar
        //    (disponible tras una reconexión reciente, antes de desbloquear)
        if (!restored) {
          const tempRefresh =
            sessionStorage.getItem("genmypass_temp_refresh") ??
            localStorage.getItem("genmypass_temp_refresh");
          if (tempRefresh) {
            try {
              const tokens = await provider.refreshAccessToken(tempRefresh);
              setTokens(tokens);
              restored = true;
            } catch {
              // El refresh token temporal tampoco funciona
            }
          }
        }

        if (!restored) {
          setError(LOCK_NO_TOKEN_KEY);
          return;
        }
      }

      const encryptedContent = await provider.readVaultFile(fileId);
      const encrypted: EncryptedVault = JSON.parse(encryptedContent);

      const vaultSaltBase64 =
        encrypted.salt ?? saltBase64;
      if (!vaultSaltBase64) {
        sessionStorage.setItem(
          "genmypass_vault_file_to_delete",
          fileId
        );
        clearVaultState();
        setNeedsSetupAgain(true);
        setError(LOCK_CONFIG_NOT_FOUND_KEY);
        return;
      }

      // Si no derivamos la clave antes (salt no estaba en localStorage), derivar ahora
      if (!key) {
        const salt = fromBase64(vaultSaltBase64);
        ({ key } = deriveKey(password, salt));
      }

      // Asegurar que el salt está persistido en localStorage para futuras sesiones
      if (vaultSaltBase64 && !localStorage.getItem("genmypass_salt")) {
        localStorage.setItem("genmypass_salt", vaultSaltBase64);
      }

      await decrypt({
        key,
        ciphertext: {
          iv: fromBase64(encrypted.iv),
          tag: fromBase64(encrypted.tag),
          data: fromBase64(encrypted.data),
        },
      });

      setMasterKey(key);

      // Si hay un refresh token temporal (de una reconexión reciente), cifrarlo
      // y persistirlo en localStorage para que sobreviva entre pestañas/sesiones.
      const tempRefresh =
        sessionStorage.getItem("genmypass_temp_refresh") ??
        localStorage.getItem("genmypass_temp_refresh");
      if (tempRefresh) {
        const encryptedRefresh = await encryptRefreshToken(tempRefresh, key);
        storeRefreshToken(encryptedRefresh);
        sessionStorage.removeItem("genmypass_temp_refresh");
        localStorage.removeItem("genmypass_temp_refresh");
      }

      startAutoRefresh(key, provider);
      navigate("/vault", { replace: true });
    } catch (err) {
      const classification = classifyApiError(err);
      const message =
        err instanceof Error ? err.message : t(LOCK_WRONG_PASSWORD_KEY);
      const isNoToken =
        classification.type === "session_expired" ||
        message === "No hay token de acceso disponible" ||
        (message.includes("token") && message.includes("disponible"));
      const isFileGone =
        classification.type === "not_found" ||
        message.includes("404") ||
        message.includes("not found") ||
        message.includes("No se encontró");
      if (isFileGone) {
        const fileIdToDelete = localStorage.getItem(
          "genmypass_vault_file_id"
        );
        if (fileIdToDelete) {
          sessionStorage.setItem(
            "genmypass_vault_file_to_delete",
            fileIdToDelete
          );
        }
        clearVaultState();
        setNeedsSetupAgain(true);
        setError(LOCK_VAULT_GONE_KEY);
        setErrorClassification(null);
      } else if (isNoToken) {
        setError(LOCK_NO_TOKEN_KEY);
        setErrorClassification(null);
      } else {
        const next = failedAttempts + 1;
        setFailedAttempts(next);
        if (next >= 3) startCooldown(next - 2);
        setError(null);
        setErrorClassification(classification);
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-[#f8fafc] dark:bg-slate-900">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 dark:bg-primary-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 dark:bg-primary-500/10 rounded-full blur-[120px]" />

      <div className="flex flex-col w-full max-w-[440px] z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 mb-5">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-primary-900 dark:text-white text-3xl font-bold tracking-tight mb-2">
            {t("lock.title")}
          </h1>
          <div className="flex items-center gap-1.5 text-primary-500">
            <Lock className="w-4 h-4" />
            <p className="text-xs font-bold tracking-widest uppercase">
              {t("lock.locked")}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 flex flex-col shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6 px-2 leading-relaxed font-medium">
            {t("lock.enterPassword")}
          </p>

          {(error || errorClassification) && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-red-600 dark:text-red-400 text-sm">{errorDisplay}</p>
              {errorClassification?.retryable && (
                <button
                  type="button"
                  onClick={() => handleUnlock()}
                  className="mt-3 w-full h-12 rounded-xl font-semibold text-sm text-white bg-primary-500 hover:bg-primary-600 transition-colors"
                >
                  {t("common.retry")}
                </button>
              )}
              {needsReconnect && (
                <button
                  type="button"
                  onClick={handleReconnect}
                  className="mt-3 w-full h-12 rounded-xl font-semibold text-sm text-white bg-primary-500 hover:bg-primary-600 transition-colors"
                >
                  {t("lock.reconnectDrive")}
                </button>
              )}
              {needsSetupAgain && (
                <button
                  type="button"
                  onClick={async () => {
                    localStorage.setItem(
                      "genmypass_force_new_setup",
                      "true"
                    );
                    const fileIdToDelete = sessionStorage.getItem(
                      "genmypass_vault_file_to_delete"
                    );
                    const cloudProvider = getCurrentProvider();
                    if (fileIdToDelete && getAccessToken() && cloudProvider) {
                      try {
                        await cloudProvider.deleteVaultFile(fileIdToDelete);
                      } catch {
                        // Ignore: AuthCallbackPage will use the flag
                      }
                      sessionStorage.removeItem(
                        "genmypass_vault_file_to_delete"
                      );
                    }
                    clearVaultState();
                    setError(null);
                    setErrorClassification(null);
                    setNeedsSetupAgain(false);
                    navigate("/", { replace: true });
                  }}
                  className="mt-3 w-full h-12 rounded-xl font-semibold text-sm text-white bg-primary-500 hover:bg-primary-600 transition-colors"
                >
                  {t("lock.setupAgain")}
                </button>
              )}
            </div>
          )}

          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              placeholder={t("lock.placeholder")}
              autoComplete="current-password"
              className="w-full h-14 pl-4 pr-12 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500 transition-colors"
              aria-label={showPassword ? t("onboarding.password.ariaHidePassword") : t("onboarding.password.ariaShowPassword")}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleUnlock}
            disabled={!password.trim() || isUnlocking || cooldownSeconds > 0}
            className="w-full h-14 rounded-xl font-bold text-base text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
          >
            {cooldownSeconds > 0 ? (
              <span>{t("lock.cooldown", { seconds: cooldownSeconds })}</span>
            ) : isUnlocking ? (
              <span className="flex items-center gap-2">
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
                {t("lock.unlocking")}
              </span>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                {t("lock.unlock")}
              </>
            )}
          </button>
        </div>

        <footer className="mt-12 text-center">
          <div className="flex items-center justify-center gap-4 text-slate-400 dark:text-slate-500 text-[10px] font-bold tracking-[0.15em] uppercase mb-4">
            <span>{t("lock.encrypted")}</span>
            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
            <span>{t("lock.zeroKnowledge")}</span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-xs px-6 leading-relaxed">
            {t("lock.footer")}
          </p>
        </footer>
      </div>
    </div>
  );
}
