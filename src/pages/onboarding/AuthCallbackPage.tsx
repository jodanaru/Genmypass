import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleOAuthCallback } from "@/lib/google-drive/oauth";
import { setTokens } from "@/lib/google-drive/token-manager";

type CallbackState = "processing" | "success" | "error";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>("processing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const result = await handleOAuthCallback();

        if (!result.success) {
          setState("error");
          setError(result.errorDescription || result.error || "Error desconocido");
          return;
        }

        // Guardar tokens en memoria
        if (result.tokens) {
          setTokens(result.tokens);

          // Guardar refresh_token temporalmente en sessionStorage (sin cifrar, aún no existe masterKey)
          if (result.tokens.refresh_token) {
            sessionStorage.setItem("genmypass_temp_refresh", result.tokens.refresh_token);
          }

          // Guardar en localStorage que el usuario está conectado a Google Drive
          localStorage.setItem("genmypass_cloud_provider", "google-drive");
          localStorage.setItem("genmypass_oauth_complete", "true");
        }

        setState("success");

        // Limpiar la URL (quitar code y state)
        window.history.replaceState({}, document.title, window.location.pathname);

        // Navegar al siguiente paso después de un breve delay
        setTimeout(() => {
          navigate("/setup/password", { replace: true });
        }, 1000);
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Error procesando autenticación");
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="max-w-md w-full text-center">
        {state === "processing" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6">
              <svg className="animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
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
              Conectando con Google Drive...
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Estamos verificando tu autorización
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 text-green-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              ¡Conexión exitosa!
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Redirigiendo al siguiente paso...
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 text-red-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Error de conexión
            </h1>
            <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
            <button
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
