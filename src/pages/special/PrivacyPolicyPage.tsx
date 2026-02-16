import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ShieldCheck, Mail } from "lucide-react";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("privacy.backToHome")}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Title */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t("privacy.title")}
          </h1>
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-500 mb-10 ml-16">
          {t("privacy.lastUpdated")}
        </p>

        <article className="space-y-8 text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed">
          {/* Introduction */}
          <Section title={t("privacy.introTitle")}>
            <p>{t("privacy.introText")}</p>
          </Section>

          {/* 1. Data Controller */}
          <Section title={t("privacy.controllerTitle")}>
            <p>{t("privacy.controllerText")}</p>
            <EmailLink email={t("privacy.controllerEmail")} />
          </Section>

          {/* 2. Data We Collect */}
          <Section title={t("privacy.dataCollectedTitle")}>
            <p>{t("privacy.dataCollectedIntro")}</p>
            <ul className="mt-4 space-y-4">
              <DefinitionItem
                title={t("privacy.dataCollectedItem1Title")}
                text={t("privacy.dataCollectedItem1Text")}
              />
              <DefinitionItem
                title={t("privacy.dataCollectedItem2Title")}
                text={t("privacy.dataCollectedItem2Text")}
              />
              <DefinitionItem
                title={t("privacy.dataCollectedItem3Title")}
                text={t("privacy.dataCollectedItem3Text")}
              />
            </ul>
          </Section>

          {/* 3. Data We Do NOT Collect */}
          <Section title={t("privacy.dataNotCollectedTitle")}>
            <p>{t("privacy.dataNotCollectedIntro")}</p>
            <ul className="mt-3 space-y-2 list-disc list-inside marker:text-primary-500">
              <li>{t("privacy.dataNotCollectedItem1")}</li>
              <li>{t("privacy.dataNotCollectedItem2")}</li>
              <li>{t("privacy.dataNotCollectedItem3")}</li>
              <li>{t("privacy.dataNotCollectedItem4")}</li>
              <li>{t("privacy.dataNotCollectedItem5")}</li>
            </ul>
          </Section>

          {/* 4. Cloud Storage */}
          <Section title={t("privacy.cloudStorageTitle")}>
            <p>{t("privacy.cloudStorageText")}</p>
          </Section>

          {/* 5. OAuth Proxy */}
          <Section title={t("privacy.proxyTitle")}>
            <p>{t("privacy.proxyText")}</p>
          </Section>

          {/* 6. Local Storage and Cookies */}
          <Section title={t("privacy.localStorageTitle")}>
            <p>{t("privacy.localStorageText")}</p>
          </Section>

          {/* 7. Security */}
          <Section title={t("privacy.securityTitle")}>
            <p>{t("privacy.securityIntro")}</p>
            <ul className="mt-3 space-y-2 list-disc list-inside marker:text-primary-500">
              <li>{t("privacy.securityItem1")}</li>
              <li>{t("privacy.securityItem2")}</li>
              <li>{t("privacy.securityItem3")}</li>
              <li>{t("privacy.securityItem4")}</li>
              <li>{t("privacy.securityItem5")}</li>
            </ul>
          </Section>

          {/* 8. Your Rights */}
          <Section title={t("privacy.rightsTitle")}>
            <p>{t("privacy.rightsIntro")}</p>
            <ul className="mt-3 space-y-2 list-disc list-inside marker:text-primary-500">
              <li>{t("privacy.rightsItem1")}</li>
              <li>{t("privacy.rightsItem2")}</li>
              <li>{t("privacy.rightsItem3")}</li>
              <li>{t("privacy.rightsItem4")}</li>
              <li>{t("privacy.rightsItem5")}</li>
            </ul>
            <p className="mt-4">{t("privacy.rightsText")}</p>
          </Section>

          {/* 9. Changes */}
          <Section title={t("privacy.changesTitle")}>
            <p>{t("privacy.changesText")}</p>
          </Section>

          {/* 10. Contact */}
          <Section title={t("privacy.contactTitle")}>
            <p>{t("privacy.contactText")}</p>
            <EmailLink email={t("privacy.contactEmail")} />
          </Section>
        </article>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm border-t border-slate-200 dark:border-slate-700/50">
        <p>{t("landing.footer")}</p>
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

function DefinitionItem({ title, text }: { title: string; text: string }) {
  return (
    <li className="list-none">
      <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className="text-slate-600 dark:text-slate-400 mt-1">{text}</p>
    </li>
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
