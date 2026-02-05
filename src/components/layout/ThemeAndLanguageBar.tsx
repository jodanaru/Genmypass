import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Moon, Sun } from "lucide-react";

function getIsDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function ThemeAndLanguageBar() {
  const { t, i18n } = useTranslation();
  const [isDark, setIsDark] = useState(getIsDark);

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(el.classList.contains("dark")));
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const toggleDarkMode = () => {
    const next = !getIsDark();
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("genmypass_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("genmypass_theme", "light");
    }
    setIsDark(next);
  };

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="rounded-full bg-slate-200 dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 border-0 cursor-pointer focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-[var(--bg)] transition-colors"
        aria-label={t("settings.language")}
      >
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>
      <button
        type="button"
        onClick={toggleDarkMode}
        aria-label={isDark ? t("common.ariaLightMode") : t("common.ariaDarkMode")}
        className="rounded-full bg-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
      >
        <span className="block dark:hidden">
          <Moon className="w-5 h-5" aria-hidden />
        </span>
        <span className="hidden dark:block">
          <Sun className="w-5 h-5" aria-hidden />
        </span>
      </button>
    </div>
  );
}
