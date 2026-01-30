import { Link, useParams } from "react-router-dom";

export default function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6">
      <div className="mb-4 text-sm text-slate-500">
        🔒 Ruta protegida
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        EntryDetailPage
      </h1>
      <p className="text-slate-400 mb-6">
        Ver detalle de la contraseña (id: {id ?? "—"})
      </p>
      <div className="flex flex-wrap gap-2">
        <Link to={id ? `/entry/${id}/edit` : "/"} className="px-3 py-2 bg-blue-600 rounded text-sm">
          Editar
        </Link>
        <Link to="/vault" className="px-3 py-2 bg-slate-700 rounded text-sm">
          Volver al Vault
        </Link>
      </div>
    </div>
  );
}
