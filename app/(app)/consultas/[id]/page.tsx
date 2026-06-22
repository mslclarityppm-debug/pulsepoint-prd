// Detalle de un hilo de consulta: muestra mensajes y permite responder.
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { consultationMessages, consultations } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getCSRFToken } from "@/lib/csrf";
import { formatearFechaHora } from "@/lib/formato";

import { FormularioMensaje } from "./formulario-mensaje";

export const dynamic = "force-dynamic";

export default async function ConsultaDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const csrfToken = await getCSRFToken();
  const id = Number(params?.id);
  if (!Number.isFinite(id)) notFound();

  const rows = await db
    .select()
    .from(consultations)
    .where(eq(consultations.id, id))
    .limit(1);
  const cons = rows?.[0];
  if (!cons) notFound();
  // Solo el propietario o admin
  if (cons.userId !== user.id && user.role !== "admin") notFound();

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
            Iniciada {formatearFechaHora(cons.createdAt)}
          </p>
        </div>
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
      </div>

      <ol className="space-y-3">
        {(mensajes ?? []).map((m) => (
          <li
            key={m.id}
            className={`rounded-lg border p-4 shadow-sm ${
              m.esAdmin
                ? "bg-accent border-accent"
                : "bg-card"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">
                {m.esAdmin ? "Equipo gestor" : "Tú"}
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
      {cons.estado === "cerrada" && (
        <p className="text-sm text-muted-foreground text-center">
          Esta consulta está cerrada. Crea una nueva si necesitas seguir.
        </p>
      )}
    </div>
  );
}
