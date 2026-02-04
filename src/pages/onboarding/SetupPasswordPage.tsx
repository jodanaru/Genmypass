import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle,
  Circle,
} from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding";
import { initSodium, deriveKeyWithNewSalt, encrypt, toBase64 } from "@/lib/crypto";
import {
  encryptRefreshToken,
  storeRefreshToken,
  saveVault,
  getAccessToken,
} from "@/lib/google-drive";
import { useAuthStore } from "@/stores/auth-store";

interface PasswordState {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

const SYMBOL_REGEX = /[!@#$%^&*(),.?":{}|<>]/;

export default function SetupPasswordPage() {
  const navigate = useNavigate();
  const setMasterKey = useAuthStore((s) => s.setMasterKey);
  const [state, setState] = useState<PasswordState>({
    password: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  );

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(document.documentElement.classList.contains("dark"));
  };

  const hasMinLength = state.password.length >= 12;
  const hasUpperAndLower =
    /[a-z]/.test(state.password) && /[A-Z]/.test(state.password);
  const hasNumber = /\d/.test(state.password);
  const hasSymbol = SYMBOL_REGEX.test(state.password);
  const passwordsMatch =
    state.password === state.confirmPassword && state.confirmPassword.length > 0;

  const allRequirementsMet =
    hasMinLength && hasUpperAndLower && hasNumber && hasSymbol;
  const canContinue = allRequirementsMet && passwordsMatch;

  const getStrength = (): number => {
    let strength = 0;
    if (hasMinLength) strength++;
    if (hasUpperAndLower) strength++;
    if (hasNumber) strength++;
    if (hasSymbol) strength++;
    return strength;
  };

  const strengthLabels: Record<number, string> = {
    0: "Enter a password",
    1: "Weak password",
    2: "Fair password",
    3: "Good password",
    4: "Strong password",
  };

  const strengthColors = {
    bar: [
      "bg-gray-200 dark:bg-slate-700",
      "bg-red-500",
      "bg-yellow-500",
      "bg-lime-500",
      "bg-green-500",
    ],
    text: [
      "text-slate-400",
      "text-red-500",
      "text-yellow-500",
      "text-lime-500",
      "text-green-500",
    ],
  };

  const handleContinue = async () => {
    if (!canContinue || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      await initSodium();

      const { key: masterKey, salt } = deriveKeyWithNewSalt(state.password);

      localStorage.setItem("genmypass_salt", toBase64(salt));
      setMasterKey(masterKey);

      const tempRefresh = sessionStorage.getItem("genmypass_temp_refresh");
      if (tempRefresh) {
        const encryptedRefresh = await encryptRefreshToken(tempRefresh, masterKey);
        storeRefreshToken(encryptedRefresh);
        sessionStorage.removeItem("genmypass_temp_refresh");
      }

      const emptyVault = {
        version: 1,
        entries: [],
        folders: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const vaultJson = JSON.stringify(emptyVault);
      const vaultBytes = new TextEncoder().encode(vaultJson);
      const { iv, tag, data } = await encrypt({
        key: masterKey,
        plaintext: vaultBytes,
      });

      const encryptedVault = JSON.stringify({
        iv: toBase64(iv),
        tag: toBase64(tag),
        data: toBase64(data),
      });

      if (!getAccessToken()) {
        throw new Error("No hay sesión de Google Drive activa");
      }

      const fileId = await saveVault(encryptedVault);
      localStorage.setItem("genmypass_vault_file_id", fileId);
      localStorage.setItem("genmypass_setup_step", "password_created");

      navigate("/setup/security");
    } catch (err) {
      console.error("Error en setup:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al configurar tu cuenta. Inténtalo de nuevo."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] transition-colors duration-200">
      <header className="w-full py-8 px-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img
              alt="Genmypass"
              className="w-8 h-8"
              src="/logo.png"
            />
            <span className="font-bold text-xl text-slate-800 dark:text-white">
              Genmypass
            </span>
          </div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Step 2 of 4
          </span>
        </div>
        <OnboardingProgress currentStep={2} totalSteps={4} />
      </header>

      <main className="flex-1 flex justify-center py-6 px-4 pb-20">
        <div className="max-w-[520px] w-full flex flex-col">
          <div className="pb-6 pt-2">
            <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight">
              Create Master Password
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Set a strong password to protect your digital life. This is the
              only key to your vault.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Warning panel */}
          <div className="mb-8">
            <div className="flex flex-col items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-900/30 p-5">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500 font-bold">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-base leading-tight">
                  This password cannot be recovered.
                </p>
              </div>
              <p className="text-yellow-800/80 dark:text-yellow-400/80 text-sm leading-relaxed">
                Write it down and keep it in a safe place. Genmypass is
                zero-knowledge; if you lose this password, your data is gone
                forever.
              </p>
              <a
                href="#"
                className="text-sm font-bold leading-normal tracking-tight flex items-center gap-1 text-primary-500 hover:underline mt-1"
              >
                Learn about zero-knowledge
                <ArrowRight className="w-4 h-4 shrink-0" />
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Master Password */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-900 dark:text-white text-sm font-semibold leading-normal">
                Master Password
              </label>
              <div className="relative">
                <input
                  type={state.showPassword ? "text" : "password"}
                  value={state.password}
                  onChange={(e) =>
                    setState((s) => ({ ...s, password: e.target.value }))
                  }
                  placeholder="Enter a strong master password"
                  className="w-full h-14 px-4 pr-12 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setState((s) => ({ ...s, showPassword: !s.showPassword }))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500 transition-colors"
                  aria-label={state.showPassword ? "Hide password" : "Show password"}
                >
                  {state.showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {/* Strength bar */}
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3, 4].map((level) => {
                  const strength = getStrength();
                  return (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        strength >= level
                          ? strengthColors.bar[strength]
                          : strengthColors.bar[0]
                      }`}
                    />
                  );
                })}
              </div>
              <p
                className={`text-xs font-medium mt-1 ${
                  strengthColors.text[getStrength()]
                }`}
              >
                {strengthLabels[getStrength()]}
              </p>
            </div>

            {/* Requirements checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
              {[
                { met: hasMinLength, label: "12+ characters" },
                { met: hasUpperAndLower, label: "Uppercase & lowercase" },
                { met: hasNumber, label: "At least one number" },
                { met: hasSymbol, label: "At least one symbol" },
              ].map((req, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm"
                >
                  {req.met ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-primary-500" />
                  ) : (
                    <Circle className="w-4 h-4 shrink-0 text-slate-300 dark:text-slate-600" />
                  )}
                  <span
                    className={
                      req.met
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-400 dark:text-slate-500"
                    }
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Confirm Master Password */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-900 dark:text-white text-sm font-semibold leading-normal">
                Confirm Master Password
              </label>
              <div className="relative">
                <input
                  type={state.showConfirmPassword ? "text" : "password"}
                  value={state.confirmPassword}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Repeat your master password"
                  className="w-full h-14 px-4 pr-12 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      showConfirmPassword: !s.showConfirmPassword,
                    }))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500 transition-colors"
                  aria-label={
                    state.showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {state.showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Continue button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue || isProcessing}
                className={`w-full font-bold py-4 rounded-xl text-lg transition-all shadow-lg ${
                  canContinue && !isProcessing
                    ? "bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/20 cursor-pointer"
                    : "bg-primary-500/50 text-white cursor-not-allowed"
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
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
                    Creating your vault...
                  </span>
                ) : (
                  "Continue to Vault"
                )}
              </button>
              <p className="text-center text-slate-500 dark:text-slate-400 text-xs mt-4 leading-relaxed">
                This password encrypts your vault locally on this device.
                <br />
                Your data never leaves your device unencrypted.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 px-6 text-center text-slate-400 dark:text-slate-500 text-xs">
        <p>© 2024 Genmypass. AES-256 Bit Encryption Standard.</p>
      </footer>

      <div className="fixed bottom-6 right-6">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:scale-110 transition-transform"
          aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
        >
          <Moon className="w-6 h-6 block dark:hidden" />
          <Sun className="w-6 h-6 hidden dark:block" />
        </button>
      </div>
    </div>
  );
}
