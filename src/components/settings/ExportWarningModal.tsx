import { useState } from "react";
import { AlertTriangle } from "lucide-react";

const CONFIRMATION_PHRASE = "I UNDERSTAND THE RISKS";

interface ExportWarningModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ExportWarningModal({
  open,
  onClose,
  onConfirm,
}: ExportWarningModalProps) {
  const [confirmText, setConfirmText] = useState("");

  const handleConfirm = () => {
    if (confirmText !== CONFIRMATION_PHRASE) return;
    onConfirm();
    setConfirmText("");
    onClose();
  };

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Security Warning
          </h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm text-left space-y-2">
            You are about to export your passwords in <strong>plain text</strong>.
            <br />
            <br />
            This file will contain <strong>all your passwords</strong> without any
            encryption. Anyone who gets this file can see all your credentials.
            <br />
            <br />
            Only use this for migrating to another password manager.{" "}
            <strong>DELETE the file immediately after import.</strong>
          </p>
        </div>

        <div className="mb-6">
          <label
            htmlFor="export-confirm-input"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
          >
            Type &quot;{CONFIRMATION_PHRASE}&quot; to continue:
          </label>
          <input
            id="export-confirm-input"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRMATION_PHRASE}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-400"
            autoComplete="off"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmText !== CONFIRMATION_PHRASE}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
              confirmText === CONFIRMATION_PHRASE
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
            }`}
          >
            Export Unencrypted
          </button>
        </div>
      </div>
    </div>
  );
}
