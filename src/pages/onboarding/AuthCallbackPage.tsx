import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  classifyApiError,
  getApiErrorMessageKey,
  type ApiErrorClassification,
} from "@/lib/api-errors";
import {
  createProvider,
  getStoredProvider,
  setTokens,
} from "@/lib/cloud-storage";

type CallbackState = "processing" | "checking_vault" | "success" | "error";

export default function AuthCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>("processing");
  const [errorClassification, setErrorClassification] =
    useState<ApiErrorClassification | null>(null);
  const [statusMessageKey, setStatusMessageKey] = useState(
    "onboarding.callback.verifying"
  );
  const providerName = getStoredProvider();

  const processCallback = useCallback(async () => {
    setState("processing");
    setErrorClassification(null);

    try {
      const stored = getStoredProvider();
      if (!stored) {
        setState("error");
        setErrorClassification(
          classifyApiError(null, undefined)
        );
        return;
      }

      const provider = createProvider(stored);
      const result = await provider.handleOAuthCallback();

      if (!result.success) {
        setState("error");
        const classification = classifyApiError(null, result.status);
        setErrorClassification(classification);
        return;
      }

      if (result.tokens) {
        setTokens(result.tokens);

        if (result.tokens.refresh_token) {
          sessionStorage.setItem(
            "genmypass_temp_refresh",
            result.tokens.refresh_token
          );
          // También guardar en localStorage para que esté disponible en otras
          // pestañas. Se eliminará en cuanto se cifre con la master key.
          localStorage.setItem(
            "genmypass_temp_refresh",
            result.tokens.refresh_token
          );
        }

        const email = await provider.getUserEmail();
        if (email) {
          localStorage.setItem("genmypass_user_email", email);
        }
      }

      setState("checking_vault");
      setStatusMessageKey("onboarding.callback.findingVault");

      const existingVault = await provider.findVaultFile();
      const forceNewSetup =
        localStorage.getItem("genmypass_force_new_setup") === "true";

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      if (forceNewSetup) {
        localStorage.removeItem("genmypass_force_new_setup");
      }

      if (existingVault && !forceNewSetup) {
        localStorage.setItem("genmypass_vault_file_id", existingVault.id);
        localStorage.setItem("genmypass_oauth_complete", "true");

        setState("success");
        setStatusMessageKey("onboarding.callback.vaultFound");

        setTimeout(() => {
          navigate("/lock", { replace: true });
        }, 1000);
      } else {
        localStorage.setItem("genmypass_oauth_complete", "true");

        setState("success");
        setStatusMessageKey("onboarding.callback.setupAccount");

        setTimeout(() => {
          navigate("/setup/password", { replace: true });
        }, 1000);
      }
    } catch (err) {
      console.error("Error en callback:", err);
      setState("error");
      setErrorClassification(classifyApiError(err));
    }
  }, [navigate]);

  useEffect(() => {
    processCallback();
  }, [processCallback]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="max-w-md w-full text-center">
        {(state === "processing" || state === "checking_vault") && (
          <>
            <div className="w-16 h-16 mx-auto mb-6">
              <svg
                className="animate-spin text-primary-500 w-full h-full"
                viewBox="0 0 24 24"
                fill="none"
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {providerName === "dropbox"
                ? t("onboarding.callback.connectingDropbox")
                : t("onboarding.callback.connectingDrive")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {t(statusMessageKey)}
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 text-green-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-full h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {t("onboarding.callback.successTitle")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {t(statusMessageKey)}
            </p>
          </>
        )}

        {state === "error" && errorClassification && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 text-red-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-full h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {t("onboarding.callback.errorTitle")}
            </h1>
            <p className="text-red-600 dark:text-red-400 mb-6">
              {t(getApiErrorMessageKey(errorClassification.type))}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {errorClassification.retryable && (
                <button
                  type="button"
                  onClick={() => processCallback()}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {t("common.retry")}
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate("/connect")}
                className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {t("common.tryAgain")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
