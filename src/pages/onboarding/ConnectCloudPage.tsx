import { useState } from "react";
import { useTranslation } from "react-i18next";
import { OnboardingProgress } from "@/components/onboarding";
import {
  classifyApiError,
  getApiErrorMessageKey,
} from "@/lib/api-errors";
import {
  createProvider,
  setStoredProvider,
  generatePKCE,
} from "@/lib/cloud-storage";

function GoogleDriveIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10 shrink-0">
      <path d="M17 6L31 6 45 30 31 30z" fill="#FFC107" />
      <path d="M9 42L17 28 45 28 37 42z" fill="#1976D2" />
      <path d="M15 42L3 22 17 6 28 26z" fill="#4CAF50" />
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
  const { t } = useTranslation();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnectingDropbox, setIsConnectingDropbox] = useState(false);
  const [errorClassification, setErrorClassification] = useState<
    ReturnType<typeof classifyApiError> | null
  >(null);
  const [showWhyStorageModal, setShowWhyStorageModal] = useState(false);

  const handleGoogleDriveConnect = async () => {
    try {
      setErrorClassification(null);
      setIsConnecting(true);
      setStoredProvider("google-drive");
      const { verifier } = await generatePKCE();
      const provider = createProvider("google-drive");
      await provider.initiateOAuth(verifier);
    } catch (err) {
      console.error("Error iniciando OAuth:", err);
      setErrorClassification(classifyApiError(err));
      setIsConnecting(false);
    }
  };

  const handleDropboxConnect = async () => {
    try {
      setErrorClassification(null);
      setIsConnectingDropbox(true);
      setStoredProvider("dropbox");
      const { verifier } = await generatePKCE();
      const provider = createProvider("dropbox");
      await provider.initiateOAuth(verifier);
    } catch (err) {
      console.error("Error iniciando OAuth Dropbox:", err);
      setErrorClassification(classifyApiError(err));
      setIsConnectingDropbox(false);
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
            {t("onboarding.stepOf", { current: 1, total: 4 })}
          </span>
        </div>
        <OnboardingProgress currentStep={1} totalSteps={4} />
      </header>

      <main className="flex-grow flex items-center justify-center px-4 pb-20">
        <div className="max-w-xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
              {t("onboarding.connect.title")}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              {t("onboarding.connect.subtitle")}
            </p>
          </div>

          {errorClassification && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                <svg
                  className="w-5 h-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-sm">
                  {t(getApiErrorMessageKey(errorClassification.type))}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setErrorClassification(null)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
                aria-label={t("common.close")}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          <div className="space-y-4">
            {/* Google Drive card */}
            <div className="bg-white dark:bg-slate-800 border-2 border-primary-500 p-6 rounded-xl shadow-sm relative transition-all hover:shadow-md group">
              <div className="absolute -top-3 left-6 bg-primary-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                {t("onboarding.connect.recommended")}
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <GoogleDriveIcon />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                      {t("onboarding.connect.googleDrive")}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      {t("onboarding.connect.freeStorage")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleDriveConnect}
                  disabled={isConnecting}
                  className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 shrink-0"
                >
                  {isConnecting ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
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
                      {t("common.connecting")}
                    </>
                  ) : (
                    <>
                      {t("onboarding.connect.connect")}
                      <ArrowForwardIcon />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Dropbox card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <img
                      src="/dropbox_128.svg"
                      alt="Dropbox"
                      className="w-10 h-10 shrink-0 object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                      {t("onboarding.connect.dropbox")}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      {t("onboarding.connect.freeStorage")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDropboxConnect}
                  disabled={isConnectingDropbox}
                  className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 shrink-0"
                >
                  {isConnectingDropbox ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
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
                      {t("common.connecting")}
                    </>
                  ) : (
                    <>
                      {t("onboarding.connect.connect")}
                      <ArrowForwardIcon />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => setShowWhyStorageModal(true)}
              className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors group"
            >
              <InfoIcon />
              <span className="underline underline-offset-4 decoration-2 decoration-primary-500/20 group-hover:decoration-primary-500">
                {t("onboarding.connect.whyStorage")}
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Why storage modal */}
      {showWhyStorageModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="why-storage-modal-title"
          onClick={() => setShowWhyStorageModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="why-storage-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-white mb-4"
            >
              {t("onboarding.connect.whyStorageModal.title")}
            </h3>
            <div className="space-y-3 text-slate-600 dark:text-slate-400 text-sm mb-6">
              <p>{t("onboarding.connect.whyStorageModal.paragraph1")}</p>
              <p>{t("onboarding.connect.whyStorageModal.paragraph2")}</p>
              <p>{t("onboarding.connect.whyStorageModal.paragraph3")}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowWhyStorageModal(false)}
              className="w-full py-3 px-4 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
