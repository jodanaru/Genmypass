import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Lock,
  ClipboardX,
  HardDrive,
  Key,
  Database,
  Shield,
  ShieldAlert,
  ExternalLink,
  ChevronRight,
  Upload,
  Download,
  Trash2,
  Folder,
  Loader2,
} from "lucide-react";
import { useSettingsStore, type AutoLockTime } from "@/stores/settings-store";
import { useAuthStore } from "@/stores/auth-store";
import { useVaultStore } from "@/stores/vault-store";
import { clearSessionTokens, deleteVaultFile } from "@/lib/google-drive";
import { clearAllGenmypassStorage } from "@/lib/clear-vault-data";
import { useFormatRelative } from "@/lib/format-relative";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const formatRelative = useFormatRelative();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  );

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      setTheme(el.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const lock = useAuthStore((s) => s.lock);

  const {
    autoLockMinutes,
    clearClipboard,
    defaultPasswordLength,
    includeNumbers,
    includeSymbols,
    includeUppercase,
    includeLowercase,
    excludeAmbiguousCharacters,
    allowDuplicateCharacters,
    lastSecurityAudit,
    setAutoLock,
    setClearClipboard,
    setDefaultPasswordLength,
    setIncludeNumbers,
    setIncludeSymbols,
    setIncludeUppercase,
    setIncludeLowercase,
    setExcludeAmbiguousCharacters,
    setAllowDuplicateCharacters,
  } = useSettingsStore();

  const userEmail =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("genmypass_user_email") || "account@gmail.com"
      : "account@gmail.com";
  const isConnected =
    typeof localStorage !== "undefined" &&
    !!localStorage.getItem("genmypass_vault_file_id");

  const handleDisconnect = () => {
    if (confirm(t("settings.disconnectConfirm"))) {
      clearSessionTokens();
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("genmypass_vault_file_id");
        localStorage.removeItem("ert");
      }
      useVaultStore.getState().clear();
      lock();
      navigate("/");
    }
  };

  const handleDeleteVault = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setIsDeleting(true);
    setDeleteError(null);

    const vaultFileId =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("genmypass_vault_file_id")
        : null;

    try {
      if (vaultFileId) {
        await deleteVaultFile(vaultFileId);
      }

      clearSessionTokens();
      clearAllGenmypassStorage();
      useVaultStore.getState().clear();
      lock();
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
      navigate("/");
    } catch (err) {
      console.error("Error deleting vault:", err);
      setDeleteError(t("settings.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteLocalOnly = () => {
    clearSessionTokens();
    clearAllGenmypassStorage();
    useVaultStore.getState().clear();
    lock();
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
    setDeleteError(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {t("settings.title")}
              </h1>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-1 bg-primary-500/10 text-primary-500 rounded-full">
            {t("settings.version")}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-8 px-6 space-y-6 pb-24">
        {/* SECURITY SECTION */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-wider px-6 pb-2 pt-6 uppercase">
            {t("settings.security")}
          </h3>

          {/* Auto-lock */}
          <div className="flex items-center gap-4 px-6 py-4 justify-between border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="text-primary-500 flex items-center justify-center rounded-lg bg-primary-500/10 shrink-0 w-12 h-12">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-medium">
                  {t("settings.autoLock")}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {t("settings.autoLockDesc")}
                </p>
              </div>
            </div>
            <select
              value={autoLockMinutes}
              onChange={(e) => setAutoLock(e.target.value as AutoLockTime)}
              className="bg-transparent border-none text-slate-900 dark:text-white text-sm font-semibold focus:ring-0 cursor-pointer text-right"
            >
              <option value="1">{t("settings.minute_one", { count: 1 })}</option>
              <option value="5">{t("settings.minute_other", { count: 5 })}</option>
              <option value="15">{t("settings.minute_other", { count: 15 })}</option>
              <option value="never">{t("settings.never")}</option>
            </select>
          </div>

          {/* Clear Clipboard */}
          <div className="flex items-center gap-4 px-6 py-4 justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="text-primary-500 flex items-center justify-center rounded-lg bg-primary-500/10 shrink-0 w-12 h-12">
                <ClipboardX className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-medium">
                  {t("settings.clearClipboard")}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {t("settings.clearClipboardDesc")}
                </p>
              </div>
            </div>
            <label className="relative flex h-7 w-12 cursor-pointer items-center rounded-full border-none bg-slate-200 dark:bg-slate-700 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-primary-500 transition-all shrink-0">
              <input
                type="checkbox"
                checked={clearClipboard}
                onChange={(e) => setClearClipboard(e.target.checked)}
                className="invisible absolute sr-only"
              />
              <span className="h-5 w-5 rounded-full bg-white shadow-md block transition-transform" />
            </label>
          </div>
        </section>

        {/* CLOUD STORAGE SECTION */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-wider px-6 pb-2 pt-6 uppercase">
            {t("settings.cloudStorage")}
          </h3>

          <div className="flex items-center gap-4 px-6 py-4 justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0 w-12 h-12">
                <HardDrive className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-slate-900 dark:text-white font-medium">
                    {t("settings.googleDrive")}
                  </p>
                  {isConnected && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase">
                        {t("settings.connected")}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {userEmail}
                </p>
              </div>
            </div>
            {isConnected && (
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  {t("settings.disconnect")}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* SECURITY AUDIT SECTION */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-wider px-6 pb-2 pt-6 uppercase">
            {t("settings.securityAudit")}
          </h3>

          <button
            type="button"
            onClick={() => navigate("/settings/security-audit")}
            className="w-full flex items-center gap-4 px-6 py-4 justify-between border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="text-amber-500 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10 shrink-0 w-12 h-12">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-medium">
                  {t("settings.checkBreached")}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {t("settings.scanBreaches")}
                </p>
                {lastSecurityAudit && (
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                    {t("settings.lastChecked", { time: formatRelative(lastSecurityAudit) })}
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
          </button>
        </section>

        {/* VAULT MANAGEMENT SECTION */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-wider px-6 pb-2 pt-6 uppercase">
            {t("settings.vaultManagement")}
          </h3>

          {/* Change Master Password */}
          <button
            type="button"
            onClick={() => navigate("/settings/password")}
            className="w-full flex items-center gap-4 px-6 py-4 justify-between border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="text-amber-500 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10 shrink-0 w-12 h-12">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-medium">
                  {t("settings.changeMasterPassword")}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {t("settings.changeMasterPasswordDesc")}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
          </button>

          {/* Categories */}
          <button
            type="button"
            onClick={() => navigate("/settings/folders")}
            className="w-full flex items-center gap-4 px-6 py-4 justify-between border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="text-primary-500 flex items-center justify-center rounded-lg bg-primary-500/10 shrink-0 w-12 h-12">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-medium">
                  {t("settings.categories")}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {t("settings.categoriesDesc")}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
          </button>

          {/* Data Portability */}
          <div className="flex items-center gap-4 px-6 py-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="text-slate-500 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0 w-12 h-12">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-medium">
                  {t("settings.dataPortability")}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {t("settings.dataPortabilityDesc")}
                </p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate("/settings/import")}
                className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {t("settings.import")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/settings/export")}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t("settings.export")}
              </button>
            </div>
          </div>
        </section>

        {/* GENERATOR DEFAULTS SECTION */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-wider px-6 pb-2 pt-6 uppercase">
            {t("settings.generatorDefaults")}
          </h3>

          <div className="px-6 py-6 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t("settings.defaultPasswordLength")}
                </label>
                <span className="text-primary-500 font-bold">
                  {defaultPasswordLength} {t("settings.characters")}
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={64}
                value={defaultPasswordLength}
                onChange={(e) =>
                  setDefaultPasswordLength(Number(e.target.value))
                }
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-transparent hover:border-primary-500/30 transition-all cursor-pointer">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {t("entry.uppercase")}
                </span>
                <input
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                  className="rounded text-primary-500 focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-transparent hover:border-primary-500/30 transition-all cursor-pointer">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {t("entry.lowercase")}
                </span>
                <input
                  type="checkbox"
                  checked={includeLowercase}
                  onChange={(e) => setIncludeLowercase(e.target.checked)}
                  className="rounded text-primary-500 focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-transparent hover:border-primary-500/30 transition-all cursor-pointer">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {t("entry.numbers")}
                </span>
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="rounded text-primary-500 focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-transparent hover:border-primary-500/30 transition-all cursor-pointer">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {t("entry.symbols")}
                </span>
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="rounded text-primary-500 focus:ring-primary-500"
                />
              </label>
            </div>

            <label className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-transparent hover:border-primary-500/30 transition-all cursor-pointer block">
              <div>
                <span className="text-sm font-medium text-slate-900 dark:text-white block">
                  {t("entry.excludeAmbiguous")}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  E.g. i, I, 1, L, o, 0, O
                </span>
              </div>
              <input
                type="checkbox"
                checked={excludeAmbiguousCharacters}
                onChange={(e) =>
                  setExcludeAmbiguousCharacters(e.target.checked)
                }
                className="rounded text-primary-500 focus:ring-primary-500 shrink-0"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-transparent hover:border-primary-500/30 transition-all cursor-pointer">
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {t("entry.allowDuplicate")}
              </span>
              <input
                type="checkbox"
                checked={allowDuplicateCharacters}
                onChange={(e) =>
                  setAllowDuplicateCharacters(e.target.checked)
                }
                className="rounded text-primary-500 focus:ring-primary-500"
              />
            </label>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-wider px-6 pb-2 pt-6 uppercase">
            {t("settings.about")}
          </h3>

          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
            <div className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div>
                <p className="text-slate-900 dark:text-white font-medium">
                  {t("settings.theme")}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {t("settings.themeDesc")}
                </p>
              </div>
              <select
                value={theme}
                onChange={(e) => {
                  const v = e.target.value as "light" | "dark";
                  setTheme(v);
                  if (v === "dark") {
                    document.documentElement.classList.add("dark");
                    localStorage.setItem("genmypass_theme", "dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                    localStorage.setItem("genmypass_theme", "light");
                  }
                }}
                className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="light">{t("settings.themeLight")}</option>
                <option value="dark">{t("settings.themeDark")}</option>
              </select>
            </div>
            <div className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div>
                <p className="text-slate-900 dark:text-white font-medium">
                  {t("settings.language")}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {t("settings.languageDesc")}
                </p>
              </div>
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <a
              href="https://genmypass.app/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {t("settings.terms")}
              </span>
              <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
            </a>
            <a
              href="https://genmypass.app/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {t("settings.privacy")}
              </span>
              <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
            </a>
            <div className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse shrink-0" />
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {t("settings.appUpToDate")}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t("settings.version")}
              </span>
            </div>
          </div>
        </section>

        {/* DANGER ZONE */}
        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setShowDeleteConfirm(true);
              setDeleteError(null);
            }}
            className="text-red-500 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t("settings.deleteVaultPermanently")}
          </button>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {t("settings.deleteVaultConfirmTitle")}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t("settings.deleteVaultDesc")}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t("settings.typeDeleteToConfirm")}
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) =>
                  setDeleteConfirmText(e.target.value.toUpperCase())
                }
                placeholder={t("settings.typeDeletePlaceholder")}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {deleteError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400 text-sm mb-2">
                  {deleteError}
                </p>
                <button
                  type="button"
                  onClick={handleDeleteLocalOnly}
                  className="text-red-500 text-sm underline hover:no-underline"
                >
                  {t("settings.deleteLocalOnly")}
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                  setDeleteError(null);
                }}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteVault}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                  deleteConfirmText === "DELETE" && !isDeleting
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                } ${isDeleting ? "opacity-50 cursor-wait" : ""}`}
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("settings.deleting")}
                  </span>
                ) : (
                  t("settings.deleteForever")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
