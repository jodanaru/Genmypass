import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SearchPage() {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <div className="mb-4 text-sm text-slate-500">
        🔒 {t("vault.protectedRoute")}
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        {t("vault.searchPageTitle")}
      </h1>
      <p className="text-slate-400 mb-6">
        {t("vault.searchPageDescription")}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link to="/vault" className="px-3 py-2 bg-slate-700 rounded text-sm">
          {t("vault.backToVault")}
        </Link>
        <Link to="/generator" className="px-3 py-2 bg-slate-700 rounded text-sm">
          {t("vault.generator")}
        </Link>
      </div>
    </div>
  );
}
