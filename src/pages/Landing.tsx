/**
 * Landing: hero, feature cards, CTA y footer.
 * Redirige a /vault si está desbloqueado, a /lock si ya tiene vault configurado,
 * o muestra la landing para usuarios nuevos.
 */

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export function Landing() {
  const { t } = useTranslation();
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
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary-500/30">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {t("landing.title")}
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            {t("landing.subtitle")}
          </p>

          <div className="space-y-4 mb-10 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {t("landing.featureZeroKnowledge")}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("landing.featureZeroKnowledgeDesc")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {t("landing.featureCloudStorage")}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("landing.featureCloudStorageDesc")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {t("landing.featureEncryption")}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("landing.featureEncryptionDesc")}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/connect")}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors shadow-lg shadow-primary-500/30"
          >
            {t("landing.getStarted")}
          </button>

          <Link
            to="/slides"
            className="inline-block mt-4 text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors underline underline-offset-4"
          >
            {t("landing.presentation")}
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-slate-400 dark:text-slate-500 text-sm space-y-2">
        <p>{t("landing.footer")}</p>
        <Link
          to="/privacy"
          className="inline-block text-slate-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 underline underline-offset-4 transition-colors"
        >
          {t("landing.privacyPolicy")}
        </Link>
      </footer>
    </div>
  );
}
