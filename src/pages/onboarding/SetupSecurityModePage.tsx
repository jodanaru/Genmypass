import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, ShieldCheck, Moon, Sun } from "lucide-react";

const SECURITY_MODE_KEY = "genmypass_security_mode";

export type SecurityMode = "password-only" | "dual-key";

export default function SetupSecurityModePage() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<SecurityMode>("password-only");
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  );

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(document.documentElement.classList.contains("dark"));
  };

  const handleContinue = () => {
    localStorage.setItem(SECURITY_MODE_KEY, selectedMode);

    if (selectedMode === "password-only") {
      navigate("/");
    } else {
      navigate("/setup/secret-key");
    }
  };

  const progressPercent = Math.round((3 / 4) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <img alt="Genmypass" className="w-8 h-8" src="/logo.png" />
          <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">
            Genmypass
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center py-12 px-4 pb-20">
        <div className="w-full max-w-[640px] flex flex-col">
          {/* Progress bar */}
          <div className="flex flex-col gap-3 mb-8 w-full">
            <div className="flex gap-6 justify-between items-end">
              <p className="text-slate-900 dark:text-white text-base font-medium">
                Step 3 of 4
              </p>
              <p className="text-slate-900 dark:text-white text-sm font-normal">
                {progressPercent}%
              </p>
            </div>
            <div className="rounded-full bg-slate-200 dark:bg-slate-800 h-2 w-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">
              Security Configuration
            </p>
          </div>

          {/* Headline */}
          <div className="mb-10 text-center">
            <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight mb-2">
              Choose Security Level
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              Select the encryption model that best fits your security needs.
            </p>
          </div>

          {/* Security options */}
          <div className="flex flex-col gap-4 mb-8">
            {/* Option 1: Password Only (Recommended) */}
            <button
              type="button"
              onClick={() => setSelectedMode("password-only")}
              className={`relative group cursor-pointer text-left w-full p-6 rounded-xl transition-all shadow-sm border-2 ${
                selectedMode === "password-only"
                  ? "border-primary-500 bg-primary-500/5 dark:bg-primary-500/10"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-500 text-white mb-2 w-fit">
                    Recommended
                  </span>
                  <h3 className="text-slate-900 dark:text-white text-lg font-bold">
                    Password Only
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-[85%]">
                    Secure your vault with just your master password. Standard
                    zero-knowledge encryption that&apos;s easy to access across
                    all your devices.
                  </p>
                </div>
                <div className="flex items-center justify-center size-6 rounded-full border-2 border-primary-500 shrink-0 mt-0.5">
                  {selectedMode === "password-only" && (
                    <div className="size-3 rounded-full bg-primary-500" />
                  )}
                </div>
              </div>
            </button>

            {/* Option 2: Dual-Key */}
            <button
              type="button"
              onClick={() => setSelectedMode("dual-key")}
              className={`relative group cursor-pointer text-left w-full p-6 rounded-xl transition-all shadow-sm border-2 ${
                selectedMode === "dual-key"
                  ? "border-primary-500 bg-primary-500/5 dark:bg-primary-500/10"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-2 w-fit">
                    Maximum Security
                  </span>
                  <h3 className="text-slate-900 dark:text-white text-lg font-bold">
                    Dual-Key
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-[85%]">
                    Requires both your Master Password and a unique Secret Key
                    file stored locally. Protection even if your password is
                    compromised.
                  </p>
                </div>
                <div
                  className={`flex items-center justify-center size-6 rounded-full border-2 shrink-0 mt-0.5 ${
                    selectedMode === "dual-key"
                      ? "border-primary-500"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {selectedMode === "dual-key" && (
                    <div className="size-3 rounded-full bg-primary-500" />
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Help link & action */}
          <div className="flex flex-col items-center gap-6">
            <button
              type="button"
              className="flex items-center gap-2 text-primary-500 text-sm font-medium hover:underline group"
            >
              <HelpCircle className="w-[18px] h-[18px] shrink-0" aria-hidden />
              What&apos;s the difference?
            </button>

            {/* Continue button */}
            <button
              type="button"
              onClick={handleContinue}
              className="w-full max-w-sm py-3.5 px-6 bg-primary-500 text-white font-semibold rounded-lg shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-colors focus:ring-4 focus:ring-primary-500/30"
            >
              Continue to Vault
            </button>
          </div>

          {/* Zero-Knowledge banner */}
          <div className="mt-12 p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 flex items-center gap-4">
            <div className="flex-shrink-0 size-12 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center text-primary-500 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Zero-Knowledge Guaranteed
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                We can never see your data. Your encryption keys never leave your
                device.
              </p>
            </div>
          </div>
        </div>
      </main>

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
