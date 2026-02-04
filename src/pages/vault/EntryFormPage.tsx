import { Link, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

interface LocationState {
  generatedPassword?: string;
}

export default function EntryFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isNew = location.pathname === "/entry/new";
  const state = location.state as LocationState | null;
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isNew && state?.generatedPassword) {
      setPassword(state.generatedPassword);
    }
  }, [isNew, state?.generatedPassword]);

  return (
    <div className="p-6">
      <div className="mb-4 text-sm text-slate-500">
        🔒 Ruta protegida
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        EntryFormPage
      </h1>
      <p className="text-slate-400 mb-6">
        {isNew ? "Crear nueva contraseña" : `Editar contraseña (id: ${id ?? "—"})`}
      </p>
      {isNew && (
        <div className="mb-4">
          <label htmlFor="entry-password" className="block text-sm font-medium text-slate-300 mb-1">
            Contraseña
          </label>
          <input
            id="entry-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full max-w-md px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white font-mono"
            placeholder="Contraseña"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Link to="/vault" className="px-3 py-2 bg-blue-600 rounded text-sm">
          Guardar y volver
        </Link>
        <Link to="/vault" className="px-3 py-2 bg-slate-700 rounded text-sm">
          Cancelar
        </Link>
      </div>
    </div>
  );
}
