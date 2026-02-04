import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Shield } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { readVaultFile, getAccessToken } from "@/lib/google-drive";
import {
  initSodium,
  deriveKey,
  decrypt,
  fromBase64,
} from "@/lib/crypto";

const NO_TOKEN_MESSAGE =
  "Google Drive session expired. Reconnect your account to unlock your vault.";

interface EncryptedVault {
  salt?: string;
  iv: string;
  tag: string;
  data: string;
}

export default function LockScreenPage() {
  const navigate = useNavigate();
  const setMasterKey = useAuthStore((s) => s.setMasterKey);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsReconnect = error === NO_TOKEN_MESSAGE;

  useEffect(() => {
    const fileId = localStorage.getItem("genmypass_vault_file_id");
    if (fileId && !getAccessToken()) {
      setError(NO_TOKEN_MESSAGE);
    }
  }, []);

  const handleReconnect = () => {
    setError(null);
    navigate("/connect", { replace: true });
  };

  const handleUnlock = async () => {
    if (!password.trim() || isUnlocking) return;

    if (!getAccessToken()) {
      setError(NO_TOKEN_MESSAGE);
      return;
    }

    setIsUnlocking(true);
    setError(null);

    try {
      const fileId = localStorage.getItem("genmypass_vault_file_id");
      if (!fileId) {
        setError("No se encontró el vault. Vuelve a conectar tu cuenta.");
        return;
      }

      await initSodium();
      const encryptedContent = await readVaultFile(fileId);
      const encrypted: EncryptedVault = JSON.parse(encryptedContent);

      const saltBase64 =
        encrypted.salt ?? localStorage.getItem("genmypass_salt");
      if (!saltBase64) {
        setError(
          "Configuración del vault no encontrada. Configura tu cuenta de nuevo."
        );
        return;
      }

      const salt = fromBase64(saltBase64);
      const { key } = deriveKey(password, salt);

      await decrypt({
        key,
        ciphertext: {
          iv: fromBase64(encrypted.iv),
          tag: fromBase64(encrypted.tag),
          data: fromBase64(encrypted.data),
        },
      });

      setMasterKey(key);
      navigate("/vault", { replace: true });
    } catch (err) {
      console.error("Unlock error:", err);
      const message =
        err instanceof Error ? err.message : "Contraseña incorrecta o error al cargar el vault.";
      const isNoToken =
        message === "No hay token de acceso disponible" ||
        (message.includes("token") && message.includes("disponible"));
      setError(isNoToken ? NO_TOKEN_MESSAGE : message);
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-[#f8fafc] dark:bg-slate-900">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 dark:bg-primary-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 dark:bg-primary-500/10 rounded-full blur-[120px]" />

      <div className="flex flex-col w-full max-w-[440px] z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 mb-5">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-primary-900 dark:text-white text-3xl font-bold tracking-tight mb-2">
            Genmypass
          </h1>
          <div className="flex items-center gap-1.5 text-primary-500">
            <Lock className="w-4 h-4" />
            <p className="text-xs font-bold tracking-widest uppercase">
              Vault is locked
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 flex flex-col shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6 px-2 leading-relaxed font-medium">
            Enter your master password to access your encrypted passwords.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              {needsReconnect && (
                <button
                  type="button"
                  onClick={handleReconnect}
                  className="mt-3 w-full h-12 rounded-xl font-semibold text-sm text-white bg-primary-500 hover:bg-primary-600 transition-colors"
                >
                  Reconnect Google Drive
                </button>
              )}
            </div>
          )}

          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              placeholder="Master password"
              autoComplete="current-password"
              className="w-full h-14 pl-4 pr-12 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleUnlock}
            disabled={!password.trim() || isUnlocking}
            className="w-full h-14 rounded-xl font-bold text-base text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
          >
            {isUnlocking ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Unlocking...
              </span>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Unlock
              </>
            )}
          </button>
        </div>

        <footer className="mt-12 text-center">
          <div className="flex items-center justify-center gap-4 text-slate-400 dark:text-slate-500 text-[10px] font-bold tracking-[0.15em] uppercase mb-4">
            <span>AES-256 Encrypted</span>
            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
            <span>Zero Knowledge</span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-xs px-6 leading-relaxed">
            Protected by end-to-end encryption. Your data never leaves your
            device unencrypted.
          </p>
        </footer>
      </div>
    </div>
  );
}
