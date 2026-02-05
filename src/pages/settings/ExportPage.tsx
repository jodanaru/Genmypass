import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import {
  initSodium,
  deriveKey,
  fromBase64,
  timingSafeEqual,
} from "@/lib/crypto";
import { useAuthStore } from "@/stores/auth-store";
import { useVault } from "@/hooks/useVault";
import { useVaultStore } from "@/stores/vault-store";
import { exportVaultEncrypted, exportVaultCSV } from "@/lib/export";
import { ExportWarningModal } from "@/components/settings/ExportWarningModal";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const navigate = useNavigate();
  const masterKey = useAuthStore((s) => s.masterKey);
  const { vault, isLoading: vaultLoading } = useVault();
  const vaultFileSalt = useVaultStore((s) => s.vaultFileSalt);

  const [showEncryptedModal, setShowEncryptedModal] = useState(false);
  const [encryptedPassword, setEncryptedPassword] = useState("");
  const [showEncryptedPassword, setShowEncryptedPassword] = useState(false);
  const [encryptedError, setEncryptedError] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);

  const [showCsvWarning, setShowCsvWarning] = useState(false);
  const [showCsvPasswordModal, setShowCsvPasswordModal] = useState(false);
  const [csvPassword, setCsvPassword] = useState("");
  const [showCsvPassword, setShowCsvPassword] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isCsvExporting, setIsCsvExporting] = useState(false);

  const salt =
    vaultFileSalt ??
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("genmypass_salt")
      : null);

  const canExport = vault && vault.entries.length >= 0 && salt;

  const handleExportEncrypted = async () => {
    if (!vault || !encryptedPassword.trim() || !salt || !masterKey) return;

    setIsEncrypting(true);
    setEncryptedError(null);

    try {
      await initSodium();
      const { key: derivedKey } = deriveKey(
        encryptedPassword,
        fromBase64(salt)
      );
      if (!timingSafeEqual(derivedKey, masterKey)) {
        setEncryptedError("Incorrect master password.");
        return;
      }
      const blob = await exportVaultEncrypted(vault, encryptedPassword);
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `genmypass-backup-${date}.genmypass`);
      setEncryptedPassword("");
      setShowEncryptedModal(false);
    } catch (err) {
      console.error("Export encrypted error:", err);
      setEncryptedError("Export failed. Please try again.");
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleCsvWarningConfirm = () => {
    setShowCsvWarning(false);
    setShowCsvPasswordModal(true);
    setCsvPassword("");
    setCsvError(null);
  };

  const handleExportCsv = async () => {
    if (!vault || !csvPassword.trim() || !salt || !masterKey) return;

    setIsCsvExporting(true);
    setCsvError(null);

    try {
      await initSodium();
      const { key: derivedKey } = deriveKey(csvPassword, fromBase64(salt));
      if (!timingSafeEqual(derivedKey, masterKey)) {
        setCsvError("Incorrect master password.");
        return;
      }
      const blob = exportVaultCSV(vault);
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `genmypass-export-${date}.csv`);
      setCsvPassword("");
      setShowCsvPasswordModal(false);
      alert(
        "Delete this file after importing to your new password manager."
      );
    } catch (err) {
      console.error("Export CSV error:", err);
      setCsvError("Export failed. Please try again.");
    } finally {
      setIsCsvExporting(false);
    }
  };

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
              Export
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-8 px-6 space-y-6 pb-24">
        {vaultLoading && (
          <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading vault...
          </p>
        )}
        {!vaultLoading && !canExport && (
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Connect your vault and unlock to export.
          </p>
        )}

        {/* Encrypted Backup card */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-primary-500 flex items-center justify-center rounded-lg bg-primary-500/10 shrink-0 w-12 h-12">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Encrypted Backup
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Download a .genmypass file encrypted with your master password.
                  Only you can open it.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEncryptedError(null);
                    setEncryptedPassword("");
                    setShowEncryptedModal(true);
                  }}
                  disabled={!canExport}
                  className="mt-4 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Encrypted Backup
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CSV for Migration card */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-amber-500 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10 shrink-0 w-12 h-12">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    CSV for Migration
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full">
                    Migration only
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Export passwords as plain text CSV. Only for moving to another
                  password manager. Delete the file after import.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCsvWarning(true)}
                  disabled={!canExport}
                  className="mt-4 px-4 py-2 rounded-lg border border-amber-500/50 text-amber-600 dark:text-amber-400 text-sm font-bold hover:bg-amber-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Encrypted export: password modal */}
      {showEncryptedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Enter master password
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Confirm your master password to create the encrypted backup.
            </p>
            <div className="relative mb-4">
              <input
                type={showEncryptedPassword ? "text" : "password"}
                value={encryptedPassword}
                onChange={(e) => setEncryptedPassword(e.target.value)}
                placeholder="Master password"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowEncryptedPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showEncryptedPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {encryptedError && (
              <p className="text-red-500 text-sm mb-4">{encryptedError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowEncryptedModal(false);
                  setEncryptedPassword("");
                  setEncryptedError(null);
                }}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportEncrypted}
                disabled={!encryptedPassword.trim() || isEncrypting}
                className="flex-1 px-4 py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isEncrypting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  "Export"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV export: password modal (after warning) */}
      {showCsvPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Enter master password
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Verify your identity to export the CSV file.
            </p>
            <div className="relative mb-4">
              <input
                type={showCsvPassword ? "text" : "password"}
                value={csvPassword}
                onChange={(e) => setCsvPassword(e.target.value)}
                placeholder="Master password"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCsvPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showCsvPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {csvError && (
              <p className="text-red-500 text-sm mb-4">{csvError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCsvPasswordModal(false);
                  setCsvPassword("");
                  setCsvError(null);
                }}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!csvPassword.trim() || isCsvExporting}
                className="flex-1 px-4 py-3 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCsvExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  "Export CSV"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ExportWarningModal
        open={showCsvWarning}
        onClose={() => setShowCsvWarning(false)}
        onConfirm={handleCsvWarningConfirm}
      />
    </div>
  );
}
