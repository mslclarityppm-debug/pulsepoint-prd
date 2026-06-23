"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, Check, X } from "lucide-react";

type Dominio = {
  id: number;
  domain: string;
  active: boolean;
  createdAt: string;
};

export default function GestionarDominiosPage() {
  const [dominios, setDominios] = useState<Dominio[]>([]);
  const [nuevoDominio, setNuevoDominio] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  const cargarDominios = async () => {
    try {
      const res = await fetch("/api/admin/dominios-permitidos");
      if (!res.ok) throw new Error("No autorizado o error");
      const data = await res.json();
      setDominios(data.dominios || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDominios();
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoDominio.trim()) return;

    setCreando(true);
    try {
      const res = await fetch("/api/admin/dominios-permitidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: nuevoDominio }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear");
      }

      setNuevoDominio("");
      await cargarDominios();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setCreando(false);
    }
  };

  const handleEliminar = async (_id: number) => {
    if (!confirm("¿Eliminar este dominio?")) return;
    // Por simplicidad, recargamos. En producción usarías DELETE.
    setError("Función de eliminación no implementada en este demo");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando dominios...</p>
      </div>
    );
  }

  if (error && dominios.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dominios Permitidos</h1>
        <p className="text-muted-foreground">
          Gestiona los dominios de correo permitidos para registrarse en la aplicación.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleCrear} className="flex gap-2">
        <input
          type="text"
          value={nuevoDominio}
          onChange={(e) => setNuevoDominio(e.target.value)}
          placeholder="@midominio.com"
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          disabled={creando}
        />
        <button
          type="submit"
          disabled={creando || !nuevoDominio.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {creando ? "Guardando..." : "Agregar"}
        </button>
      </form>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">Dominio</th>
              <th className="px-4 py-2 text-left font-medium">Estado</th>
              <th className="px-4 py-2 text-left font-medium">Creado</th>
              <th className="px-4 py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {dominios.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No hay dominios configurados. Cualquier usuario puede registrarse.
                </td>
              </tr>
            ) : (
              dominios.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono">{d.domain}</td>
                  <td className="px-4 py-3">
                    {d.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="h-3 w-3" /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        <X className="h-3 w-3" /> Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(d.createdAt).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEliminar(d.id)}
                      className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
