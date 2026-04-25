// Listado de consultas del usuario.
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { MessageCircle, Plus } from "lucide-react";
import { db } from "@/db";
import { consultations } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatearFechaHora } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function ConsultasPage() {
  const user = await requireUser();
  const items = await db
    .select()
    .from(consultations)
    .where(eq(consultations.userId, user.id))
    .orderBy(desc(consultations.updatedAt));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            Consultas
          </h1>
          <p className="text-muted-foreground mt-1">
            Comunica tus dudas con el equipo gestor.
          </p>
        </div>
        <Link
          href="/consultas/nueva"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nueva consulta
        </Link>
      </div>

      {items?.length ? (
        <ul className="grid gap-3">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/consultas/${c.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.asunto}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Actualizada: {formatearFechaHora(c.updatedAt)}
                  </p>
                </div>
                <span
                  className={`badge ${
                    c.estado === "cerrada"
                      ? "badge-muted"
                      : c.estado === "en_proceso"
                        ? "badge-warning"
                        : "badge-primary"
                  }`}
                >
                  {c.estado.replace("_", " ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border bg-card p-8 shadow-sm text-center">
          <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="mt-3 text-muted-foreground">
            Aún no tienes consultas.
          </p>
          <Link
            href="/consultas/nueva"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
          >
            Crear la primera
          </Link>
        </div>
      )}
    </div>
  );
}
