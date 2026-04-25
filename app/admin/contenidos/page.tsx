// CMS de contenidos: listar + crear + activar/desactivar + eliminar.
import { asc } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { db } from "@/db";
import { contents } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import {
  accionEliminarContenido,
  accionToggleContenido,
} from "@/actions/contenidos";
import { FormularioContenido } from "./formulario-contenido";

export const dynamic = "force-dynamic";

export default async function ContenidosAdminPage() {
  await requireAdmin();
  const items = await db.select().from(contents).orderBy(asc(contents.orden));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          Contenidos
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona la biblioteca educativa.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold mb-3">
            Nuevo contenido
          </h2>
          <FormularioContenido />
        </section>

        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold mb-3">
            Contenidos existentes
          </h2>
          <ul className="divide-y">
            {(items ?? []).map((c) => (
              <li key={c.id} className="py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{c.tipo}</span>
                    {c.categoria && <span>· {c.categoria}</span>}
                  </div>
                  <p className="font-medium truncate">{c.titulo}</p>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline truncate block"
                  >
                    {c.url}
                  </a>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await accionToggleContenido(c.id, !c.activo);
                  }}
                >
                  <button
                    type="submit"
                    className={`text-xs px-2 py-1 rounded-md border ${
                      c.activo
                        ? "bg-card hover:bg-accent"
                        : "bg-muted text-muted-foreground"
                    }`}
                    title={c.activo ? "Desactivar" : "Activar"}
                  >
                    {c.activo ? "Activo" : "Inactivo"}
                  </button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await accionEliminarContenido(c.id);
                  }}
                >
                  <button
                    type="submit"
                    aria-label="Eliminar"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </li>
            ))}
            {!items?.length && (
              <p className="text-sm text-muted-foreground py-4">
                Aún no hay contenidos.
              </p>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
