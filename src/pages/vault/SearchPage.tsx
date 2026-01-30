import { Link } from "react-router-dom";

export default function SearchPage() {
  return (
    <div className="p-6">
      <div className="mb-4 text-sm text-slate-500">
        🔒 Ruta protegida
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        SearchPage
      </h1>
      <p className="text-slate-400 mb-6">
        Búsqueda y filtros de contraseñas
      </p>
      <div className="flex flex-wrap gap-2">
        <Link to="/vault" className="px-3 py-2 bg-slate-700 rounded text-sm">
          Volver al Vault
        </Link>
        <Link to="/generator" className="px-3 py-2 bg-slate-700 rounded text-sm">
          Generador
        </Link>
      </div>
    </div>
  );
}
