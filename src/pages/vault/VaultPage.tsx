import { Link } from "react-router-dom";

export default function VaultPage() {
  return (
    <div className="p-6">
      <div className="mb-4 text-sm text-slate-500">
        🔒 Ruta protegida
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        VaultPage
      </h1>
      <p className="text-slate-400 mb-6">
        Lista principal de contraseñas guardadas
      </p>
      <div className="flex flex-wrap gap-2">
        <Link to="/entry/new" className="px-3 py-2 bg-blue-600 rounded text-sm">
          + Nueva entrada
        </Link>
        <Link to="/generator" className="px-3 py-2 bg-slate-700 rounded text-sm">
          Generador
        </Link>
        <Link to="/search" className="px-3 py-2 bg-slate-700 rounded text-sm">
          Búsqueda
        </Link>
        <Link to="/settings" className="px-3 py-2 bg-slate-700 rounded text-sm">
          Settings
        </Link>
      </div>
    </div>
  );
}
