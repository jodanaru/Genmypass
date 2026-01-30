import { Link } from "react-router-dom";

export default function ChangePasswordPage() {
  return (
    <div className="p-6">
      <div className="mb-4 text-sm text-slate-500">
        🔒 Ruta protegida
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        ChangePasswordPage
      </h1>
      <p className="text-slate-400 mb-6">
        Cambiar master password
      </p>
      <div className="flex flex-wrap gap-2">
        <Link to="/settings" className="px-3 py-2 bg-slate-700 rounded text-sm">
          Volver a Settings
        </Link>
        <Link to="/vault" className="px-3 py-2 bg-slate-700 rounded text-sm">
          Vault
        </Link>
      </div>
    </div>
  );
}
