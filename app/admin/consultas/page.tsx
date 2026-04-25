// Bandeja de consultas para el admin.
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { consultations, userProfiles, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatearFechaHora } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function AdminConsultasPage() {
  await requireAdmin();
  const items = await db
    .select({
      id: consultations.id,
      asunto: consultations.asunto,
      estado: consultations.estado,
      updatedAt: consultations.updatedAt,
      userId: consultations.userId,
      email: users.email,
      nombre: userProfiles.nombre,
    })
    .from(consultations)
    .leftJoin(users, eq(users.id, consultations.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .orderBy(desc(consultations.updatedAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          Bandeja de consultas
        </h1>
        <p className="text-muted-foreground mt-1">
          Responde y gestiona el estado de cada hilo.
        </p>
      </div>
      {items?.length ? (
        <ul className="grid gap-3">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/consultas/${c.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.asunto}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.nombre ?? c.email} ·{" "}
                    {formatearFechaHora(c.updatedAt)}
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
        <p className="text-sm text-muted-foreground">No hay consultas.</p>
      )}
    </div>
  );
}
