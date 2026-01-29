import { useEffect, useState } from "react";
import { initSodium } from "@/lib/crypto";

type SetupStatus = "idle" | "loading" | "ready" | "error";

function App() {
  const [setupStatus, setSetupStatus] = useState<SetupStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSetupStatus("loading");
    setErrorMessage(null);

    initSodium()
      .then(() => {
        if (!cancelled) {
          setSetupStatus("ready");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSetupStatus("error");
          setErrorMessage(err instanceof Error ? err.message : String(err));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-6 dark">
      <div className="max-w-md w-full rounded-2xl bg-[var(--bg-card)] border border-slate-700/50 shadow-xl p-8 flex flex-col items-center gap-6">
        <img
          src="/logo.png"
          alt="Genmypass"
          className="h-20 w-auto object-contain"
        />
        <h1 className="text-2xl font-bold text-primary-400">Genmypass</h1>
        <p className="text-sm text-[var(--text-muted)] text-center">
          Password manager zero-knowledge
        </p>

        <div className="w-full rounded-lg bg-slate-800/50 p-4 space-y-2">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Estado del setup
          </p>
          <div className="flex items-center gap-2">
            <StatusBadge status={setupStatus} />
            <span className="text-sm">
              {setupStatus === "idle" && "Sin iniciar"}
              {setupStatus === "loading" && "Iniciando crypto (libsodium)…"}
              {setupStatus === "ready" && "Crypto listo (Argon2id + AES-256-GCM)"}
              {setupStatus === "error" && "Error al cargar crypto"}
            </span>
          </div>
          {errorMessage && (
            <p className="text-xs text-red-400 mt-1">{errorMessage}</p>
          )}
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Favicon y logo cargados desde /favicon.ico y /logo.png
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SetupStatus }) {
  const styles: Record<SetupStatus, string> = {
    idle: "bg-slate-500",
    loading: "bg-amber-500 animate-pulse",
    ready: "bg-emerald-500",
    error: "bg-red-500",
  };
  return (
    <span
      className={`inline-flex h-2 w-2 rounded-full ${styles[status]}`}
      title={status}
      aria-hidden
    />
  );
}

export default App;
