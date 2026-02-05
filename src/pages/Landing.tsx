/**
 * Landing: hero, feature cards, CTA y footer.
 * Redirige a /vault si está desbloqueado, a /lock si ya tiene vault configurado,
 * o muestra la landing para usuarios nuevos.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

function toggleDarkMode() {
  document.documentElement.classList.toggle("dark");
}

export function Landing() {
  const navigate = useNavigate();
  const isUnlocked = useAuthStore((s) => s.isUnlocked);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isUnlocked) {
      navigate("/vault", { replace: true });
      return;
    }

    const hasVault = localStorage.getItem("genmypass_vault_file_id");
    const forceNewSetup =
      localStorage.getItem("genmypass_force_new_setup") === "true";

    if (hasVault && !forceNewSetup) {
      navigate("/lock", { replace: true });
    } else {
      setIsChecking(false);
    }
  }, [navigate, isUnlocked]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <button
        type="button"
        onClick={toggleDarkMode}
        aria-label="Alternar tema claro/oscuro"
        className="fixed top-6 right-6 z-10 rounded-full bg-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
      >
        <span className="material-icons-round">dark_mode</span>
      </button>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary-500/30">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Genmypass
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Zero-knowledge password manager. Your passwords, encrypted in your
            cloud.
          </p>

          <div className="space-y-4 mb-10 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Zero-Knowledge
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  We never see your passwords
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Your Cloud Storage
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Data stored in your Google Drive
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  AES-256 Encryption
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Military-grade security
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/connect")}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors shadow-lg shadow-primary-500/30"
          >
            Get Started
          </button>
        </div>
      </main>

      <footer className="py-6 text-center text-slate-400 dark:text-slate-500 text-sm">
        <p>© 2024 Genmypass. Made with ❤️ for your security.</p>
      </footer>
    </div>
  );
}
