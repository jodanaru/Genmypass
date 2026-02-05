import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function OfflinePage() {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <div className="mb-4 text-sm text-slate-500">
        📴 {t("offline.specialRoute")}
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        {t("offline.title")}
      </h1>
      <p className="text-slate-400 mb-6">
        {t("offline.description")}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link to="/vault" className="px-3 py-2 bg-blue-600 rounded text-sm">
          {t("offline.retryOrVault")}
        </Link>
        <Link to="/" className="px-3 py-2 bg-slate-700 rounded text-sm">
          {t("common.home")}
        </Link>
      </div>
    </div>
  );
}
