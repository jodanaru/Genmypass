/**
 * Presentación TFM: reveal.js montado en React.
 * Acceso: /slides (pública, sin layout del vault).
 * Tema y idioma: la barra superior controla claro/oscuro e i18n; esta página reacciona a ambos.
 */
import { useEffect, useRef, useState } from "react";
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
  const { i18n } = useTranslation();

  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;

    const reveal = Reveal(el, {
      hash: true,
      embedded: false,
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
      <div ref={revealRef} className="reveal h-full w-full">
        <div className="slides">
          <SlidesContent />
        </div>
      </div>
    </div>
  );
}
