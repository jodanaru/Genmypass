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

export default function SlidesPage() {
  const revealRef = useRef<HTMLDivElement>(null);
  const revealApiRef = useRef<{ layout(): void } | null>(null);
  const [isDark, setIsDark] = useState(getIsDark);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;

    const reveal = Reveal(el, {
      hash: true,
      embedded: false,
      width: 960,
      height: 700,
      margin: 0.04,
      minScale: 0.2,
      maxScale: 1.0,
    });
    reveal.initialize();
    revealApiRef.current = reveal;

    return () => {
      revealApiRef.current = null;
      reveal.destroy();
    };
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

  const wrapperClass = `slides-page fixed inset-0 min-h-screen w-full ${isDark ? "dark" : ""}`.trim();

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
    </div>
  );
}
