import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, KeyRound, Settings } from "lucide-react";

const NAV_ITEMS = [
  { path: "/vault", icon: ShieldCheck, labelKey: "nav.vault" as const },
  { path: "/generator", icon: KeyRound, labelKey: "nav.generator" as const },
  { path: "/settings", icon: Settings, labelKey: "nav.settings" as const },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 h-20 flex justify-center items-center z-50"
      aria-label={t("nav.ariaMain")}
    >
      <div className="flex w-full max-w-[1280px] px-8 justify-between items-center">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive
                  ? "text-primary-500"
                  : "text-slate-400 hover:text-primary-500 dark:text-slate-500 dark:hover:text-primary-500"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={`w-6 h-6 ${isActive ? "fill-current" : ""}`}
                aria-hidden
              />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {t(item.labelKey)}
              </span>
              {isActive && (
                <div
                  className="w-1.5 h-1.5 rounded-full bg-primary-500"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
