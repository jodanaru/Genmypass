/**
 * Contenido de la presentación TFM para Genmypass.
 * Cada bloque se renderiza como una <section> de reveal.js.
 * Usa i18n (slides.*) para idioma español/inglés.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export function SlidesContent(): ReactNode {
  const { t } = useTranslation();

  return (
    <>
      <section>
        <h2>{t("slides.title")}</h2>
        <p>{t("slides.subtitle")}</p>
        <p className="text-lg opacity-80 mt-4">{t("slides.tfm")}</p>
      </section>

      <section>
        <h2>{t("slides.objectiveTitle")}</h2>
        <p>{t("slides.objectiveProblem")}</p>
        <p className="mt-4">
          {t("slides.objectiveApproachBefore")}
          <strong>{t("slides.objectiveApproachStrong")}</strong>
          {t("slides.objectiveApproachAfter")}
        </p>
      </section>

      <section className="slide--scroll">
        <h2>{t("slides.stackTitle")}</h2>
        <div className="slide-content">
          <ul className="text-left max-w-xl mx-auto list-disc pl-8 space-y-2">
            <li>{t("slides.stack1")}</li>
            <li>{t("slides.stack2")}</li>
            <li>{t("slides.stack3")}</li>
            <li>{t("slides.stack4")}</li>
            <li>{t("slides.stack5")}</li>
            <li>{t("slides.stack6")}</li>
          </ul>
        </div>
      </section>

      <section className="slide--scroll">
        <h2>{t("slides.architectureTitle")}</h2>
        <div className="slide-content">
          <p className="text-left max-w-2xl mx-auto">
            {t("slides.architectureBody")}
          </p>
        </div>
      </section>

      <section className="slide--scroll">
        <h2>{t("slides.featuresTitle")}</h2>
        <div className="slide-content">
          <ul className="text-left max-w-xl mx-auto list-disc pl-8 space-y-2">
            <li>{t("slides.feature1")}</li>
            <li>{t("slides.feature2")}</li>
            <li>{t("slides.feature3")}</li>
            <li>{t("slides.feature4")}</li>
            <li>{t("slides.feature5")}</li>
            <li>{t("slides.feature6")}</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>{t("slides.demoTitle")}</h2>
        <p>
          <a href="https://genmypass.app" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
            {t("slides.demoUrl")}
          </a>
        </p>
        <p className="mt-4 text-sm opacity-80">{t("slides.demoNote")}</p>
      </section>

      <section>
        <h2>{t("slides.conclusionsTitle")}</h2>
        <p>{t("slides.conclusionsP1")}</p>
        <p className="mt-4">{t("slides.conclusionsP2")}</p>
        <p className="mt-8 text-lg">{t("slides.thanks")}</p>
      </section>
    </>
  );
}
