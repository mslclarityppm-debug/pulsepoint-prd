// Detalle admin de una consulta: ver hilo, responder, cerrar.
import { asc, eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";

import { accionCerrarConsulta } from "@/actions/consultas";
import { FormularioMensaje } from "@/app/(app)/consultas/[id]/formulario-mensaje";
import { db } from "@/db";
import {
  consultationMessages,
  consultations,
  userProfiles,
  users,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getCSRFToken } from "@/lib/csrf";
import { formatearFechaHora } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function AdminConsultaDetallePage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const csrfToken = await getCSRFToken();
  const id = Number(params?.id);
  if (!Number.isFinite(id)) notFound();

  const rows = await db
    .select({
      id: consultations.id,
      asunto: consultations.asunto,
      estado: consultations.estado,
      createdAt: consultations.createdAt,
      userId: consultations.userId,
      email: users.email,
      nombre: userProfiles.nombre,
    })
    .from(consultations)
    .leftJoin(users, eq(users.id, consultations.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(consultations.id, id))
    .limit(1);
  const cons = rows?.[0];
  if (!cons) notFound();

  const mensajes = await db
    .select()
    .from(consultationMessages)
    .where(eq(consultationMessages.consultationId, cons.id))
    .orderBy(asc(consultationMessages.createdAt));

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            {cons.asunto}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Usuario: {cons.nombre ?? cons.email} · Iniciada{" "}
            {formatearFechaHora(cons.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`badge ${
              cons.estado === "cerrada"
                ? "badge-muted"
                : cons.estado === "en_proceso"
                  ? "badge-warning"
                  : "badge-primary"
            }`}
          >
            {cons.estado.replace("_", " ")}
          </span>
        {cons.estado !== "cerrada" && (
          <form
            action={async () => {
              "use server";
              await accionCerrarConsulta(cons.id);
            }}
          >
            <input type="hidden" name="csrf" value={csrfToken} />
            <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border bg-card text-xs hover:bg-accent"
                title="Cerrar consulta"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Cerrar
              </button>
            </form>
          )}
        </div>
      </div>

      <ol className="space-y-3">
        {(mensajes ?? []).map((m) => (
          <li
            key={m.id}
            className={`rounded-lg border p-4 shadow-sm ${
              m.esAdmin ? "bg-accent border-accent" : "bg-card"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">
                {m.esAdmin ? "Tú (admin)" : cons.nombre ?? cons.email}
              </span>
              <span>{formatearFechaHora(m.createdAt)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
              {m.mensaje}
            </p>
          </li>
        ))}
      </ol>

      {cons.estado !== "cerrada" && (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <FormularioMensaje consultationId={cons.id} csrfToken={csrfToken} />
        </div>
      )}
    </div>
  );
}
