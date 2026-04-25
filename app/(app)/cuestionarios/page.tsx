// Listado de cuestionarios activos + historial de respuestas.
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowRight, ClipboardCheck, History } from "lucide-react";
import { db } from "@/db";
import { questionnaires, questionnaireResponses } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatearFecha } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function CuestionariosPage() {
  const user = await requireUser();
  const activos = await db
    .select()
    .from(questionnaires)
    .where(eq(questionnaires.activo, true));
  const historial = await db
    .select({
      id: questionnaireResponses.id,
      fecha: questionnaireResponses.fecha,
      puntuacion: questionnaireResponses.puntuacion,
      questionnaireId: questionnaireResponses.questionnaireId,
      titulo: questionnaires.titulo,
    })
    .from(questionnaireResponses)
    .leftJoin(
      questionnaires,
      eq(questionnaires.id, questionnaireResponses.questionnaireId),
    )
    .where(eq(questionnaireResponses.userId, user.id))
    .orderBy(desc(questionnaireResponses.fecha));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          Cuestionarios
        </h1>
        <p className="text-muted-foreground mt-1">
          Evalúa periódicamente tus hábitos saludables.
        </p>
      </div>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" /> Disponibles
        </h2>
        {activos?.length ? (
          <ul className="mt-4 divide-y">
            {activos.map((q) => (
              <li key={q.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{q.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {q.descripcion}
                  </p>
                </div>
                <Link
                  href={`/cuestionarios/${q.id}`}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
                >
                  Empezar <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No hay cuestionarios disponibles.
          </p>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" /> Historial
        </h2>
        {historial?.length ? (
          <ul className="mt-4 divide-y">
            {historial.map((h) => (
              <li key={h.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{h.titulo ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatearFecha(h.fecha)}
                  </p>
                </div>
                <span
                  className={`badge ${
                    h.puntuacion >= 7
                      ? "badge-ok"
                      : h.puntuacion >= 4
                        ? "badge-warning"
                        : "badge-danger"
                  }`}
                >
                  {h.puntuacion}/10
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Aún no has completado cuestionarios.
          </p>
        )}
      </section>
    </div>
  );
}
