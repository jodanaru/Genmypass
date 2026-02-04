import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleOAuthCallback } from "@/lib/google-drive/oauth";
import { setTokens } from "@/lib/google-drive/token-manager";
import { findVaultFile } from "@/lib/google-drive";

type CallbackState = "processing" | "checking_vault" | "success" | "error";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>("processing");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "Verificando autorización..."
  );

  useEffect(() => {
    const processCallback = async () => {
      try {
        const result = await handleOAuthCallback();

        if (!result.success) {
          setState("error");
          setError(
            result.errorDescription || result.error || "Error desconocido"
          );
          return;
        }

        if (result.tokens) {
          setTokens(result.tokens);

          if (result.tokens.refresh_token) {
            sessionStorage.setItem(
              "genmypass_temp_refresh",
              result.tokens.refresh_token
            );
          }

          localStorage.setItem("genmypass_cloud_provider", "google-drive");
        }

        setState("checking_vault");
        setStatusMessage("Buscando tu vault...");

        const existingVault = await findVaultFile();

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        if (existingVault) {
          localStorage.setItem("genmypass_vault_file_id", existingVault.id);
          localStorage.setItem("genmypass_oauth_complete", "true");

          setState("success");
          setStatusMessage("¡Vault encontrado! Redirigiendo...");

          setTimeout(() => {
            navigate("/lock", { replace: true });
          }, 1000);
        } else {
          localStorage.setItem("genmypass_oauth_complete", "true");

          setState("success");
          setStatusMessage("¡Conexión exitosa! Configurando tu cuenta...");

          setTimeout(() => {
            navigate("/setup/password", { replace: true });
          }, 1000);
        }
      } catch (err) {
        console.error("Error en callback:", err);
        setState("error");
        setError(
          err instanceof Error
            ? err.message
            : "Error procesando autenticación"
        );
      }
    };

    processCallback();
  }, [navigate]);

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
              Conectando con Google Drive
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {statusMessage}
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
              ¡Conexión exitosa!
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {statusMessage}
            </p>
          </>
        )}

        {state === "error" && (
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
              Error de conexión
            </h1>
            <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
            <button
              type="button"
              onClick={() => navigate("/connect")}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Intentar de nuevo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
