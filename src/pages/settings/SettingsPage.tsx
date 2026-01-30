import { Link } from "react-router-dom";

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-4 text-sm text-slate-500">
        🔒 Ruta protegida
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        SettingsPage
      </h1>
      <p className="text-slate-400 mb-6">
        Configuración de la aplicación
      </p>
      <div className="flex flex-wrap gap-2">
        <Link to="/settings/password" className="px-3 py-2 bg-blue-600 rounded text-sm">
          Cambiar master password
        </Link>
        <Link to="/folders" className="px-3 py-2 bg-slate-700 rounded text-sm">
          Carpetas
        </Link>
        <Link to="/vault" className="px-3 py-2 bg-slate-700 rounded text-sm">
          Volver al Vault
        </Link>
      </div>
    </div>
  );
}
