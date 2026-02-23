import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, FileText, Mail } from "lucide-react";

export default function TermsOfServicePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("terms.backToHome")}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t("terms.title")}
          </h1>
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-500 mb-10 ml-16">
          {t("terms.lastUpdated")}
        </p>

        <article className="space-y-8 text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed">
          <Section title={t("terms.introTitle")}>
            <p>{t("terms.introText")}</p>
          </Section>

          <Section title={t("terms.acceptanceTitle")}>
            <p>{t("terms.acceptanceText")}</p>
          </Section>

          <Section title={t("terms.serviceTitle")}>
            <p>{t("terms.serviceText")}</p>
          </Section>

          <Section title={t("terms.noWarrantyTitle")}>
            <p>{t("terms.noWarrantyText")}</p>
          </Section>

          <Section title={t("terms.responsibilityTitle")}>
            <p>{t("terms.responsibilityText")}</p>
            <ul className="mt-3 space-y-2 list-disc list-inside marker:text-primary-500">
              <li>{t("terms.responsibilityItem1")}</li>
              <li>{t("terms.responsibilityItem2")}</li>
              <li>{t("terms.responsibilityItem3")}</li>
            </ul>
          </Section>

          <Section title={t("terms.acceptableUseTitle")}>
            <p>{t("terms.acceptableUseText")}</p>
          </Section>

          <Section title={t("terms.changesTitle")}>
            <p>{t("terms.changesText")}</p>
          </Section>

          <Section title={t("terms.contactTitle")}>
            <p>{t("terms.contactText")}</p>
            <EmailLink email={t("terms.contactEmail")} />
          </Section>
        </article>
      </main>

      <footer className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm border-t border-slate-200 dark:border-slate-700/50">
        <p>{t("landing.footer", { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function EmailLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="inline-flex items-center gap-2 mt-2 text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
    >
      <Mail className="w-4 h-4" />
      {email}
    </a>
  );
}
