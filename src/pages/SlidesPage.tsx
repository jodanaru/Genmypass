/**
 * Presentación TFM: reveal.js montado en React.
 * Acceso: /slides (pública, sin layout del vault).
 * Tema y idioma: la barra superior controla claro/oscuro e i18n; esta página reacciona a ambos.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Reveal from "reveal.js/dist/reveal.esm.js";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";
import "./slides/slides.css";
import { SlidesContent } from "./slides/slidesContent";

function getIsDark(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.classList.contains("dark");
}

function isMobileViewport(): boolean {
  return window.innerWidth < 768 || window.innerHeight < 500;
}

export default function SlidesPage() {
  const revealRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const revealApiRef = useRef<any>(null);
  const [isDark, setIsDark] = useState(getIsDark);
  const [mobile] = useState(() => isMobileViewport());
  const [slideInfo, setSlideInfo] = useState({ current: 0, total: 0 });
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reveal: any = Reveal(el, {
      hash: true,
      embedded: true,
      width: mobile ? 400 : 960,
      height: 700,
      margin: mobile ? 0.08 : 0.04,
      minScale: 0.1,
      maxScale: 2.0,
      controls: true,
      progress: true,
      touch: true,
      keyboard: true,
      center: true,
    });

    let disposed = false;

    const syncSlideInfo = () => {
      if (disposed) return;
      const indices = reveal.getIndices();
      setSlideInfo({
        current: indices?.h ?? 0,
        total: reveal.getTotalSlides?.() ?? 0,
      });
    };

    reveal.initialize().then(() => {
      if (disposed) return;
      revealApiRef.current = reveal;
      syncSlideInfo();
      reveal.on("slidechanged", syncSlideInfo);
    });

    return () => {
      disposed = true;
      try { reveal.off("slidechanged", syncSlideInfo); } catch { /* noop */ }
      revealApiRef.current = null;
      reveal.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(root.classList.contains("dark")));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!revealApiRef.current) return;
    const t = setTimeout(() => revealApiRef.current?.layout(), 50);
    return () => clearTimeout(t);
  }, [i18n.language]);

  const wrapperClass = `slides-page ${mobile ? "slides-mobile" : ""} fixed inset-0 min-h-screen w-full ${isDark ? "dark" : ""}`.trim();

  return (
    <div className={wrapperClass} role="application" aria-label="Presentación">
      <Link
        to="/"
        className="fixed top-4 left-4 z-50 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 backdrop-blur transition-colors shadow-md"
      >
        {t("slides.back")}
      </Link>

      <div ref={revealRef} className="reveal h-full w-full">
        <div className="slides">
          <SlidesContent />
        </div>
      </div>

      {mobile && (
        <div className="mobile-slide-counter">
          {slideInfo.current + 1} / {slideInfo.total}
        </div>
      )}
    </div>
  );
}
