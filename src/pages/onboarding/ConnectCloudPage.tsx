import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { OnboardingProgress } from "@/components/onboarding";

function GoogleDriveIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10 shrink-0">
      <path d="M17 6L31 6 45 30 31 30z" fill="#FFC107" />
      <path d="M9 42L17 28 45 28 37 42z" fill="#1976D2" />
      <path d="M15 42L3 22 17 6 28 26z" fill="#4CAF50" />
    </svg>
  );
}

function DropboxIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-10 h-10 shrink-0 grayscale opacity-60"
      fill="#0061FF"
    >
      <path d="M6 2L1 5.2L6 8.4L11 5.2L6 2ZM18 2L13 5.2L18 8.4L23 5.2L18 2ZM1 11.6L6 14.8L11 11.6L6 8.4L1 11.6ZM13 11.6L18 14.8L23 11.6L18 8.4L13 11.6ZM6 15.6L11 18.8L6 22L1 18.8L6 15.6ZM18 15.6L13 18.8L18 22L23 18.8L18 15.6Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5 shrink-0"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm0 1.5a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Zm-.75 4.5a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0V8.25Zm1.5 8.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DarkModeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
      aria-hidden
    >
      <path d="M12 3a9 9 0 1 0 9 9c-.893 0-1.687-.12-2.37-.334A9.001 9.001 0 0 1 12 3Z" />
    </svg>
  );
}

function LightModeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
      aria-hidden
    >
      <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.59-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V18.75A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
    </svg>
  );
}

function ArrowForwardIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4 shrink-0"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function ConnectCloudPage() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  );

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(document.documentElement.classList.contains("dark"));
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
            Step 1 of 4
          </span>
        </div>
        <OnboardingProgress currentStep={1} totalSteps={4} />
      </header>

      <main className="flex-grow flex items-center justify-center px-4 pb-20">
        <div className="max-w-xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Connect Your Storage
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Your encrypted vault will be stored in your personal cloud.
            </p>
          </div>

          <div className="space-y-4">
            {/* Google Drive card */}
            <div className="bg-white dark:bg-slate-800 border-2 border-primary-500 p-6 rounded-xl shadow-sm relative transition-all hover:shadow-md group">
              <div className="absolute -top-3 left-6 bg-primary-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                Recommended
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <GoogleDriveIcon />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                      Google Drive
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      15 GB free storage
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/setup/password")}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 shrink-0"
                >
                  Connect
                  <ArrowForwardIcon />
                </button>
              </div>
            </div>

            {/* Dropbox card (disabled) */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-xl opacity-75">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <DropboxIcon />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-600 dark:text-slate-400 text-lg">
                      Dropbox
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase mt-1">
                      Coming Soon
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  className="bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 px-6 py-2.5 rounded-lg font-semibold cursor-not-allowed shrink-0"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors group"
            >
              <InfoIcon />
              <span className="underline underline-offset-4 decoration-2 decoration-primary-500/20 group-hover:decoration-primary-500">
                Why do we need this storage connection?
              </span>
            </button>
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
          <span className="block dark:hidden">
            <DarkModeIcon />
          </span>
          <span className="hidden dark:block">
            <LightModeIcon />
          </span>
        </button>
      </div>
    </div>
  );
}
