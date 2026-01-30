import { useState } from "react";
import { Link } from "react-router-dom";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Overlay móvil: cierra sidebar al hacer clic fuera */}
      <button
        type="button"
        aria-label="Cerrar menú"
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity md:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-slate-200 bg-[var(--bg-card)] shadow-card transition-transform duration-200 ease-out md:static md:translate-x-0 md:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4 md:justify-center">
          <Link to="/vault" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt=""
              className="h-8 w-8 object-contain"
              aria-hidden
            />
            <span className="font-semibold text-[var(--text)]">Genmypass</span>
          </Link>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            onClick={closeSidebar}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-4" aria-label="Principal">
          <ul className="space-y-1">
            <li>
              <Link
                to="/vault"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-[var(--text-muted)] transition-colors hover:bg-primary-50 hover:text-primary-600"
              >
                <span className="text-slate-400" aria-hidden>🏠</span>
                Inicio
              </Link>
            </li>
            <li>
              <Link
                to="/generator"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-[var(--text-muted)] transition-colors hover:bg-primary-50 hover:text-primary-600"
              >
                <span className="text-slate-400" aria-hidden>🔐</span>
                Generador
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-[var(--text-muted)] transition-colors hover:bg-primary-50 hover:text-primary-600"
              >
                <span className="text-slate-400" aria-hidden>⚙️</span>
                Ajustes
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Contenedor principal: área de contenido + header */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Barra superior: menú móvil + tema */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-[var(--bg-card)] px-4 shadow-sm">
          <button
            type="button"
            aria-label="Abrir menú"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 md:flex-none" />
          <button
            type="button"
            aria-label="Alternar tema claro/oscuro"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          </button>
        </header>

        {/* Contenido de la página */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
