import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowRight, Home } from "lucide-react";

export default function ErrorPage() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-[#f8fafc] dark:bg-slate-900">
      {/* Decorative blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-100/50 dark:bg-red-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-50/50 dark:bg-amber-500/10 rounded-full blur-[120px]" />

      <div className="flex flex-col w-full max-w-[440px] z-10">
        {/* Icon + heading */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 mb-5">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight mb-2">
            {t("errors.title")}
          </h1>
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-xs font-bold tracking-widest uppercase">
              {t("errors.subtitle")}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 flex flex-col shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6 px-2 leading-relaxed font-medium">
            {t("errors.generic")}
          </p>

          {/* Go to Vault button */}
          <Link
            to="/vault"
            className="w-full h-14 rounded-xl font-bold text-base text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 mb-3"
          >
            <ArrowRight className="w-5 h-5" />
            {t("errors.goToVault")}
          </Link>

          {/* Home link */}
          <Link
            to="/"
            className="w-full h-12 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            {t("common.home")}
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="flex items-center justify-center gap-4 text-slate-400 dark:text-slate-500 text-[10px] font-bold tracking-[0.15em] uppercase mb-4">
            <span>{t("errors.footer")}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
