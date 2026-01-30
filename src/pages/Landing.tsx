/**
 * Landing: hero, feature cards, CTA y footer (según diseño Stitch).
 * Sin cabecera ni sidebar; icono modo oscuro en esquina superior derecha del main.
 */

import { useNavigate } from "react-router-dom";

function toggleDarkMode() {
  document.documentElement.classList.toggle("dark");
}

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-hero-gradient px-6 py-12 text-center">
      {/* Modo oscuro: esquina superior derecha del contenido principal */}
      <button
        type="button"
        onClick={toggleDarkMode}
        aria-label="Alternar tema claro/oscuro"
        className="fixed top-6 right-6 z-10 rounded-full bg-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
      >
        <span className="material-icons-round">dark_mode</span>
      </button>
      {/* Hero: logo + título */}
      <div className="flex flex-col items-center space-y-4 pt-6">
        <div className="relative h-32 w-32 md:h-40 md:w-40 animate-pulse-slow">
          <img
            src="/logo.png"
            alt="Genmypass"
            className="h-full w-full object-contain"
          />
        </div>
        <h1 className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-blue-400 dark:to-blue-200 md:text-5xl">
          Genmypass
        </h1>
      </div>

      {/* Tagline + subtítulo */}
      <div className="max-w-2xl space-y-4">
        <h2 className="text-3xl font-extrabold leading-tight text-slate-800 dark:text-white md:text-4xl">
          Your passwords, your cloud, zero knowledge.
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          The secure way to manage your digital life without ever trusting a third
          party with your master key.
        </p>
      </div>

      {/* Feature cards */}
      <div className="mt-8 grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
        <Card
          icon="lock"
          title="Bank-level encryption"
          description="AES-256 encryption secures your vault before it ever leaves your device."
        />
        <Card
          icon="cloud"
          title="Stored in YOUR Google Drive"
          description="You own the storage. We don't host your data; your private cloud does."
        />
        <Card
          icon="visibility_off"
          title="Zero-knowledge"
          description="We can't see your passwords. Only you hold the key to unlock your vault."
        />
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center space-y-6 pt-8">
        <button
          type="button"
          onClick={() => navigate("/connect")}
          className="btn-gradient w-full rounded-full px-10 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50 active:scale-95 md:w-64"
        >
          Get Started
        </button>
        <a
          href="#"
          className="group flex items-center font-medium text-primary-500 hover:underline"
        >
          How it works
          <span className="material-icons-round ml-1 text-sm transition-transform group-hover:translate-x-1">
            arrow_forward
          </span>
        </a>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-12 opacity-50 md:pt-8">
        <p className="text-xs text-slate-400 dark:text-slate-600">
          © 2024 Genmypass. Security by design.
        </p>
      </div>
    </div>
  );
}

function Card({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
        <span className="material-icons-round text-primary-500">{icon}</span>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[var(--text)]">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}
