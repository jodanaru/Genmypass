import { Link } from "react-router-dom";

export default function OfflinePage() {
  return (
    <div className="p-6">
      <div className="mb-4 text-sm text-slate-500">
        📴 Ruta especial (offline)
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        OfflinePage
      </h1>
      <p className="text-slate-400 mb-6">
        Modo sin conexión
      </p>
      <div className="flex flex-wrap gap-2">
        <Link to="/vault" className="px-3 py-2 bg-blue-600 rounded text-sm">
          Reintentar / Vault
        </Link>
        <Link to="/" className="px-3 py-2 bg-slate-700 rounded text-sm">
          Inicio
        </Link>
      </div>
    </div>
  );
}
