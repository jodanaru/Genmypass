/**
 * Contenido de la presentación TFM para Genmypass (11 slides).
 * Cada bloque se renderiza como una <section> de reveal.js.
 * Usa i18n (slides.*) para idioma español/inglés.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Server,
  ShieldAlert,
  Eye,
  DollarSign,
  Lock,
  Cloud,
  ShieldOff,
  BadgeDollarSign,
  Shield,
  Package,
  ArrowLeftRight,
  Globe,
  CheckCircle2,
} from "lucide-react";

export function SlidesContent(): ReactNode {
  const { t } = useTranslation();

  return (
    <>
      {/* ===== Slide 1: Título ===== */}
      <section>
        <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "1rem" }}>
          <img
            src="/logo.png"
            alt="Genmypass logo"
            style={{ width: 100, height: 100, borderRadius: "1rem", display: "block", margin: 0 }}
          />
        </div>
        <h1 className="text-4xl font-bold">{t("slides.title")}</h1>
        <p className="text-xl opacity-90 mt-2">{t("slides.subtitle")}</p>
        <p className="text-lg mt-4 italic opacity-70">{t("slides.tagline")}</p>
        <p className="text-base mt-6 opacity-60">{t("slides.authorDate")}</p>
        <p className="text-sm opacity-50">{t("slides.tfm")}</p>
      </section>

      {/* ===== Slide 2: El Problema ===== */}
      <section>
        <h2>{t("slides.problemTitle")}</h2>
        <div className="problem-grid">
          <div className="problem-card">
            <div className="icon-wrapper">
              <Server size={20} />
            </div>
            <div>
              <h4>{t("slides.problem1Title")}</h4>
              <p>{t("slides.problem1Desc")}</p>
            </div>
          </div>
          <div className="problem-card">
            <div className="icon-wrapper">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h4>{t("slides.problem2Title")}</h4>
              <p>{t("slides.problem2Desc")}</p>
            </div>
          </div>
          <div className="problem-card">
            <div className="icon-wrapper">
              <Eye size={20} />
            </div>
            <div>
              <h4>{t("slides.problem3Title")}</h4>
              <p>{t("slides.problem3Desc")}</p>
            </div>
          </div>
          <div className="problem-card">
            <div className="icon-wrapper">
              <DollarSign size={20} />
            </div>
            <div>
              <h4>{t("slides.problem4Title")}</h4>
              <p>{t("slides.problem4Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Slide 3: La Solución ===== */}
      <section>
        <h2>{t("slides.solutionTitle")}</h2>
        <div className="solution-list">
          <div className="solution-item">
            <div className="icon-wrapper">
              <Lock size={20} />
            </div>
            <span>{t("slides.solution1")}</span>
          </div>
          <div className="solution-item">
            <div className="icon-wrapper">
              <Cloud size={20} />
            </div>
            <span>{t("slides.solution2")}</span>
          </div>
          <div className="solution-item">
            <div className="icon-wrapper">
              <ShieldOff size={20} />
            </div>
            <span>{t("slides.solution3")}</span>
          </div>
          <div className="solution-item">
            <div className="icon-wrapper">
              <BadgeDollarSign size={20} />
            </div>
            <span>{t("slides.solution4")}</span>
          </div>
        </div>
      </section>

      {/* ===== Slide 4: Arquitectura ===== */}
      <section>
        <h2>{t("slides.archTitle")}</h2>
        <div className="arch-diagram">
          <div className="arch-box">
            <strong>{t("slides.archBrowser")}</strong>
            <span>{t("slides.archBrowserSub")}</span>
          </div>
          <div className="arch-arrow">
            <span className="arrow-label">{t("slides.archArrow1")}</span>
            <span className="arrow-line">→</span>
          </div>
          <div className="arch-box">
            <strong>{t("slides.archWorker")}</strong>
            <span>{t("slides.archWorkerSub")}</span>
          </div>
          <div className="arch-arrow">
            <span className="arrow-label">{t("slides.archArrow2")}</span>
            <span className="arrow-line">→</span>
          </div>
          <div className="arch-box">
            <strong>{t("slides.archCloud")}</strong>
            <span>{t("slides.archCloudSub")}</span>
          </div>
        </div>
        <div className="arch-highlights">
          <div className="arch-highlight">{t("slides.archHighlight1")}</div>
          <div className="arch-highlight">{t("slides.archHighlight2")}</div>
        </div>
      </section>

      {/* ===== Slide 5: Stack Tecnológico ===== */}
      <section className="slide--scroll">
        <h2>{t("slides.stackTitle")}</h2>
        <div className="slide-content">
          <div className="stack-grid">
            <div className="stack-column frontend">
              <h4>{t("slides.stackFrontendTitle")}</h4>
              <ul>
                <li>{t("slides.stackFrontend1")}</li>
                <li>{t("slides.stackFrontend2")}</li>
                <li>{t("slides.stackFrontend3")}</li>
                <li>{t("slides.stackFrontend4")}</li>
                <li>{t("slides.stackFrontend5")}</li>
                <li>{t("slides.stackFrontend6")}</li>
              </ul>
            </div>
            <div className="stack-column crypto">
              <h4>{t("slides.stackCryptoTitle")}</h4>
              <ul>
                <li>{t("slides.stackCrypto1")}</li>
                <li>{t("slides.stackCrypto2")}</li>
                <li>{t("slides.stackCrypto3")}</li>
                <li>{t("slides.stackCrypto4")}</li>
              </ul>
            </div>
            <div className="stack-column backend">
              <h4>{t("slides.stackBackendTitle")}</h4>
              <ul>
                <li>{t("slides.stackBackend1")}</li>
                <li>{t("slides.stackBackend2")}</li>
                <li>{t("slides.stackBackend3")}</li>
                <li>{t("slides.stackBackend4")}</li>
              </ul>
            </div>
          </div>
          <div className="stack-cost">{t("slides.stackCostHighlight")}</div>
        </div>
      </section>

      {/* ===== Slide 6: Funcionalidades ===== */}
      <section className="slide--scroll">
        <h2>{t("slides.featuresTitle")}</h2>
        <div className="slide-content">
          <div className="feature-grid">
            <div className="feature-card">
              <div className="card-header">
                <div className="icon-wrapper">
                  <Shield size={16} />
                </div>
                <h4>{t("slides.featSecurityTitle")}</h4>
              </div>
              <ul>
                <li>{t("slides.featSecurity1")}</li>
                <li>{t("slides.featSecurity2")}</li>
                <li>{t("slides.featSecurity3")}</li>
                <li>{t("slides.featSecurity4")}</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="card-header">
                <div className="icon-wrapper">
                  <Package size={16} />
                </div>
                <h4>{t("slides.featManagementTitle")}</h4>
              </div>
              <ul>
                <li>{t("slides.featManagement1")}</li>
                <li>{t("slides.featManagement2")}</li>
                <li>{t("slides.featManagement3")}</li>
                <li>{t("slides.featManagement4")}</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="card-header">
                <div className="icon-wrapper">
                  <ArrowLeftRight size={16} />
                </div>
                <h4>{t("slides.featImportTitle")}</h4>
              </div>
              <ul>
                <li>{t("slides.featImport1")}</li>
                <li>{t("slides.featImport2")}</li>
                <li>{t("slides.featImport3")}</li>
                <li>{t("slides.featImport4")}</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="card-header">
                <div className="icon-wrapper">
                  <Globe size={16} />
                </div>
                <h4>{t("slides.featUxTitle")}</h4>
              </div>
              <ul>
                <li>{t("slides.featUx1")}</li>
                <li>{t("slides.featUx2")}</li>
                <li>{t("slides.featUx3")}</li>
                <li>{t("slides.featUx4")}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Slide 7: Flujo de Seguridad ===== */}
      <section className="slide--scroll">
        <h2>{t("slides.securityFlowTitle")}</h2>
        <div className="slide-content">
          <div className="security-flow">
            <div className="flow-step">
              <strong>{t("slides.securityFlowStep1")}</strong>
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-step">
              <strong>{t("slides.securityFlowStep2")}</strong>
              <span>{t("slides.securityFlowStep2Sub")}</span>
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-step">
              <strong>{t("slides.securityFlowStep3")}</strong>
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-step">
              <strong>{t("slides.securityFlowStep4")}</strong>
              <span>{t("slides.securityFlowStep4Sub")}</span>
            </div>
          </div>
          <div className="hibp-section">
            <h4>{t("slides.hibpTitle")}</h4>
            <p>{t("slides.hibpDesc1")}</p>
            <p className="hibp-highlight">{t("slides.hibpDesc2")}</p>
          </div>
        </div>
      </section>

      {/* ===== Slide 8: Comparativa ===== */}
      <section className="slide--scroll">
        <h2>{t("slides.compareTitle")}</h2>
        <div className="slide-content">
          <div className="compare-grid">
            {/* Header row */}
            <div className="compare-cell header">{t("slides.compareFeature")}</div>
            <div className="compare-cell header">{t("slides.compareGenmypass")}</div>
            <div className="compare-cell header">{t("slides.compareLastpass")}</div>
            <div className="compare-cell header">{t("slides.compareBitwarden")}</div>

            {/* Storage row */}
            <div className="compare-cell row-label">{t("slides.compareStorage")}</div>
            <div className="compare-cell genmypass">{t("slides.compareStorageGmp")}</div>
            <div className="compare-cell">{t("slides.compareStorageLp")}</div>
            <div className="compare-cell">{t("slides.compareStorageBw")}</div>

            {/* Zero-knowledge row */}
            <div className="compare-cell row-label">{t("slides.compareZk")}</div>
            <div className="compare-cell genmypass">{t("slides.compareZkGmp")}</div>
            <div className="compare-cell">{t("slides.compareZkLp")}</div>
            <div className="compare-cell">{t("slides.compareZkBw")}</div>

            {/* Cost row */}
            <div className="compare-cell row-label">{t("slides.compareCost")}</div>
            <div className="compare-cell genmypass">{t("slides.compareCostGmp")}</div>
            <div className="compare-cell">{t("slides.compareCostLp")}</div>
            <div className="compare-cell">{t("slides.compareCostBw")}</div>

            {/* Control row */}
            <div className="compare-cell row-label">{t("slides.compareControl")}</div>
            <div className="compare-cell genmypass">{t("slides.compareControlGmp")}</div>
            <div className="compare-cell">{t("slides.compareControlLp")}</div>
            <div className="compare-cell">{t("slides.compareControlBw")}</div>
          </div>
        </div>
      </section>

      {/* ===== Slide 9: Demo ===== */}
      <section>
        <h2>{t("slides.demoTitle")}</h2>
        <p>
          <a
            href="https://genmypass.app"
            target="_blank"
            rel="noopener noreferrer"
            className="demo-url underline text-xl"
          >
            {t("slides.demoUrl")}
          </a>
        </p>
        <p className="mt-4 text-sm opacity-80">{t("slides.demoNote")}</p>
        <ul className="demo-list">
          <li>
            <span className="demo-bullet">1</span>
            {t("slides.demoItem1")}
          </li>
          <li>
            <span className="demo-bullet">2</span>
            {t("slides.demoItem2")}
          </li>
          <li>
            <span className="demo-bullet">3</span>
            {t("slides.demoItem3")}
          </li>
          <li>
            <span className="demo-bullet">4</span>
            {t("slides.demoItem4")}
          </li>
          <li>
            <span className="demo-bullet">5</span>
            {t("slides.demoItem5")}
          </li>
        </ul>
      </section>

      {/* ===== Slide 10: Conclusiones ===== */}
      <section className="slide--scroll">
        <h2>{t("slides.conclusionsTitle")}</h2>
        <div className="slide-content">
          <ul className="conclusions-list">
            <li>
              <CheckCircle2 size={18} className="check-icon" />
              <span>{t("slides.conclusion1")}</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="check-icon" />
              <span>{t("slides.conclusion2")}</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="check-icon" />
              <span>{t("slides.conclusion3")}</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="check-icon" />
              <span>{t("slides.conclusion4")}</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="check-icon" />
              <span>{t("slides.conclusion5")}</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="check-icon" />
              <span>{t("slides.conclusion6")}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ===== Slide 11: Gracias ===== */}
      <section>
        <h2 className="text-4xl">{t("slides.thanksTitle")}</h2>
        <p className="text-xl mt-4">{t("slides.thanksAuthor")}</p>
        <p className="text-base mt-2 opacity-70">{t("slides.thanksTfm")}</p>
        <div className="thanks-links">
          <a href="https://genmypass.app" target="_blank" rel="noopener noreferrer">
            genmypass.app
          </a>
          <span className="thanks-separator">|</span>
          <a href="https://github.com/jodanaru/Genmypass" target="_blank" rel="noopener noreferrer">
            github.com/jodanaru/Genmypass
          </a>
        </div>
      </section>
    </>
  );
}
