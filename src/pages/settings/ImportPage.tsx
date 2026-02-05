import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Upload,
  FileJson,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Undo2,
} from "lucide-react";
import {
  MAX_IMPORT_FILE_SIZE,
  detectImportFormat,
  importFromGenmypass,
  importFromCSV,
  importFromBitwarden,
  importFromLastPass,
  importFrom1Password,
  type ImportResult,
} from "@/lib/import";
import { useVault } from "@/hooks/useVault";
import { useVaultStore, type Vault } from "@/stores/vault-store";
import { useSettingsStore } from "@/stores/settings-store";

const FORMAT_KEYS: Record<string, string> = {
  genmypass: "formatGenmypass",
  bitwarden: "formatBitwarden",
  "csv-lastpass": "formatLastPass",
  "csv-1password": "format1Password",
  csv: "formatCsv",
};

type ImportMode = "merge" | "replace";

export default function ImportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { save } = useVault();
  const fileId = useVaultStore((s) => s.fileId);
  const vaultFileSalt = useVaultStore((s) => s.vaultFileSalt);
  const setVault = useVaultStore((s) => s.setVault);
  const addEntry = useVaultStore((s) => s.addEntry);
  const addFolder = useVaultStore((s) => s.addFolder);
  const setSettingsFromVault = useSettingsStore((s) => s.setSettingsFromVault);

  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [genmypassPassword, setGenmypassPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const [importDone, setImportDone] = useState<ImportResult | null>(null);
  const [backupForUndo, setBackupForUndo] = useState<Vault | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleFile = useCallback(
    async (selectedFile: File | null) => {
      setFile(selectedFile);
      setPreview(null);
      setFormat(null);
      setImportError(null);
      setImportDone(null);
      setSaveError(null);

      if (!selectedFile) return;

      if (selectedFile.size > MAX_IMPORT_FILE_SIZE) {
        setImportError(t("settings.importPage.fileTooBig"));
        return;
      }

      setIsLoading(true);
      try {
        const detected = await detectImportFormat(selectedFile);
        setFormat(detected);

        if (detected === "genmypass") {
          setShowPasswordModal(true);
          setGenmypassPassword("");
          return;
        }

        let result: ImportResult;
        switch (detected) {
          case "bitwarden":
            result = await importFromBitwarden(selectedFile);
            break;
          case "csv-lastpass":
            result = await importFromLastPass(selectedFile);
            break;
          case "csv-1password":
            result = await importFrom1Password(selectedFile);
            break;
          default:
            result = await importFromCSV(selectedFile);
        }
        setPreview(result);
      } catch (err) {
        setImportError(
          err instanceof Error ? err.message : t("settings.importPage.couldNotRead")
        );
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  const handleGenmypassPasswordSubmit = useCallback(async () => {
    if (!file || !genmypassPassword.trim()) return;
    setIsLoading(true);
    setImportError(null);
    try {
      const result = await importFromGenmypass(file, genmypassPassword);
      setPreview(result);
      setShowPasswordModal(false);
      setGenmypassPassword("");
      if (!result.success && result.errors.length > 0) {
        setImportError(result.errors[0] ?? t("settings.importPage.importFailed"));
      }
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : t("settings.importPage.importFailed")
      );
    } finally {
      setIsLoading(false);
    }
  }, [file, genmypassPassword, t]);

  const handleImport = useCallback(async () => {
    if (!preview || !preview.success) return;

    const { entries, folders, settings } = preview;
    setImportProgress(t("settings.importPage.importing"));
    setIsImporting(true);
    setImportDone(null);
    setSaveError(null);

    const currentVault = useVaultStore.getState().vault;
    const currentFileId = useVaultStore.getState().fileId;
    const currentSalt = useVaultStore.getState().vaultFileSalt;

    if (mode === "replace" && currentVault && currentFileId) {
      setBackupForUndo({ ...currentVault });
    }

    try {
      if (mode === "replace" && currentVault && currentFileId) {
        const now = new Date().toISOString();
        const newVault: Vault = {
          version: 1,
          entries,
          folders,
          settings: settings ?? currentVault?.settings,
          createdAt: currentVault?.createdAt ?? now,
          updatedAt: now,
        };
        setVault(newVault, currentFileId, currentSalt ?? undefined);
        if (settings) {
          setSettingsFromVault(settings);
        }
      } else {
        const total = folders.length + entries.length;
        let done = 0;
        for (const folder of folders) {
          addFolder(folder);
          done++;
          setImportProgress(t("settings.importPage.importProgress", { done, total }));
        }
        for (const entry of entries) {
          addEntry(entry);
          done++;
          if (done % 10 === 0 || done === total) {
            setImportProgress(t("settings.importPage.importProgress", { done, total }));
          }
        }
      }
      setImportDone(preview);
      setPreview(null);
      setFile(null);
      setFormat(null);

      if (useVaultStore.getState().fileId) {
        setImportProgress(t("settings.importPage.savingToCloud"));
        try {
          await save();
        } catch {
          setSaveError(t("settings.importPage.saveAfterImportError"));
        }
      }
    } finally {
      setImportProgress(null);
      setIsImporting(false);
    }
  }, [preview, mode, save, setVault, addFolder, addEntry, setSettingsFromVault, t]);

  const handleUndo = useCallback(async () => {
    if (!backupForUndo || !fileId) return;
    setVault(backupForUndo, fileId, vaultFileSalt ?? undefined);
    setSaveError(null);
    setIsRestoring(true);
    try {
      await save();
      setBackupForUndo(null);
      setImportDone(null);
    } catch {
      setSaveError(t("settings.importPage.saveAfterRestoreError"));
    } finally {
      setIsRestoring(false);
    }
  }, [backupForUndo, fileId, vaultFileSalt, save, setVault, t]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
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
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {t("settings.importPage.title")}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-8 px-6 space-y-6 pb-24">
        {/* Dropzone */}
        <section
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center bg-white dark:bg-slate-800/50"
        >
          <Upload className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
            {t("settings.importPage.dropHere")}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mb-4">
            {t("settings.importPage.formats")}
          </p>
          <input
            type="file"
            accept=".genmypass,.json,.csv,application/json,text/csv"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="hidden"
            id="import-file-input"
          />
          <label
            htmlFor="import-file-input"
            className="inline-block px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 cursor-pointer"
          >
            {t("settings.importPage.chooseFile")}
          </label>
        </section>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t("settings.importPage.detectingFormat")}</span>
          </div>
        )}

        {importError && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {importError}
          </div>
        )}

        {preview && (
          <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                {t("settings.importPage.preview")}
              </h2>
              {format && (
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  {FORMAT_KEYS[format] ? t(`settings.importPage.${FORMAT_KEYS[format]}`) : format}
                </p>
              )}
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                {t("settings.importPage.entriesAndFolders", {
                  entries: preview.entries.length,
                  folders: preview.folders.length,
                })}
              </p>
              {preview.entries.length > 0 && (
                <ul className="text-sm text-slate-600 dark:text-slate-300 mb-4 list-disc list-inside">
                  {preview.entries.slice(0, 10).map((e) => (
                    <li key={e.id}>{e.title || t("settings.audit.untitled")}</li>
                  ))}
                  {preview.entries.length > 10 && (
                    <li className="text-slate-400">
                      +{preview.entries.length - 10} more
                    </li>
                  )}
                </ul>
              )}

              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("settings.importPage.importMode")}
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="import-mode"
                    checked={mode === "merge"}
                    onChange={() => setMode("merge")}
                    className="text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">
                    {t("settings.importPage.merge")}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="import-mode"
                    checked={mode === "replace"}
                    onChange={() => setMode("replace")}
                    className="text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">
                    {t("settings.importPage.replace")}
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || !preview.success}
                className="w-full py-3 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {importProgress ?? t("settings.importPage.importing")}
                  </>
                ) : (
                  t("settings.importPage.import")
                )}
              </button>
            </div>
          </section>
        )}

        {importDone && (
          <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                <CheckCircle className="w-5 h-5" />
                <h2 className="text-lg font-bold">{t("settings.importPage.importComplete")}</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                {t("settings.importPage.importedCount", {
                  entries: importDone.entries.length,
                  folders: importDone.folders.length,
                })}
              </p>
              {importDone.errors.length > 0 && (
                <ul className="text-red-500 text-sm list-disc list-inside mb-2">
                  {importDone.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
              {importDone.warnings.length > 0 && (
                <ul className="text-amber-600 dark:text-amber-400 text-sm list-disc list-inside mb-2">
                  {importDone.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
              {saveError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm mt-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {saveError}
                </div>
              )}
              {backupForUndo && (
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={isRestoring}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  {isRestoring ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Undo2 className="w-4 h-4" />
                  )}
                  {t("settings.importPage.undoRestore")}
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Genmypass password modal */}
      {showPasswordModal && file && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {t("settings.importPage.genmypassBackup")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              {t("settings.importPage.genmypassPasswordDesc")}
            </p>
            <input
              type="password"
              value={genmypassPassword}
              onChange={(e) => setGenmypassPassword(e.target.value)}
              placeholder={t("settings.exportPage.placeholderPassword")}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 mb-4"
              autoComplete="current-password"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setFile(null);
                  setGenmypassPassword("");
                  setImportError(null);
                }}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleGenmypassPasswordSubmit}
                disabled={!genmypassPassword.trim() || isLoading}
                className="flex-1 px-4 py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("settings.importPage.continue")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
