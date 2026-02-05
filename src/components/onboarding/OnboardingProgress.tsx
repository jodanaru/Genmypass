import { useTranslation } from "react-i18next";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps?: number;
}

export function OnboardingProgress({
  currentStep,
  totalSteps = 4,
}: OnboardingProgressProps) {
  const { t } = useTranslation();
  return (
    <div className="w-full h-1.5 flex gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={t("onboarding.stepOf", { current: currentStep, total: totalSteps })}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={`h-full flex-1 rounded-full transition-colors ${
            step <= currentStep
              ? "bg-primary-500"
              : "bg-slate-200 dark:bg-slate-800"
          }`}
          aria-hidden
        />
      ))}
    </div>
  );
}
