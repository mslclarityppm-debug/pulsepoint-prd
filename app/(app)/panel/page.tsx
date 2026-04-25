// Dashboard usuario: resumen de métricas, accesos rápidos, consultas recientes.
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import {
  Activity,
  ArrowRight,
  ClipboardCheck,
  MessageCircle,
  Plus,
  Scale,
} from "lucide-react";
import { db } from "@/db";
import {
  consultations,
  healthMetrics,
  questionnaires,
  questionnaireResponses,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import {
  clasificarTension,
  formatearFecha,
  pesoGramosAKg,
} from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const user = await requireUser();

  const ultimoPeso = await db
    .select()
    .from(healthMetrics)
    .where(
      and(eq(healthMetrics.userId, user.id), eq(healthMetrics.tipo, "peso")),
    )
    .orderBy(desc(healthMetrics.fecha))
    .limit(1);
  const ultimaTension = await db
    .select()
    .from(healthMetrics)
    .where(
      and(eq(healthMetrics.userId, user.id), eq(healthMetrics.tipo, "tension")),
    )
    .orderBy(desc(healthMetrics.fecha))
    .limit(1);

  const cuestActivos = await db
    .select()
    .from(questionnaires)
    .where(eq(questionnaires.activo, true));
  const respuestas = await db
    .select()
    .from(questionnaireResponses)
    .where(eq(questionnaireResponses.userId, user.id));
  const idsRespondidos = new Set(respuestas?.map((r) => r.questionnaireId) ?? []);
  const pendientes = (cuestActivos ?? []).filter(
    (c) => !idsRespondidos.has(c.id),
  );

  const consultasAbiertas = await db
    .select()
    .from(consultations)
    .where(eq(consultations.userId, user.id))
    .orderBy(desc(consultations.updatedAt))
    .limit(3);

  const peso = ultimoPeso?.[0];
  const tension = ultimaTension?.[0];
  const tClass = clasificarTension(
    tension?.sistolica ?? null,
    tension?.diastolica ?? null,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          Hola{user.nombre ? `, ${user.nombre}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          Aquí tienes un resumen de tu salud preventiva.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Scale className="h-4 w-4" />
              <span className="text-sm">Último peso</span>
            </div>
            <Link
              href="/metricas/nueva?tipo=peso"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Nuevo
            </Link>
          </div>
          <p className="mt-3 text-3xl font-display font-semibold">
            {peso ? `${pesoGramosAKg(peso.valorPeso)} kg` : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {peso ? formatearFecha(peso.fecha) : "Sin registros aún"}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Última tensión</span>
            </div>
            <Link
              href="/metricas/nueva?tipo=tension"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Nueva
            </Link>
          </div>
          <p className="mt-3 text-3xl font-display font-semibold">
            {tension ? `${tension.sistolica}/${tension.diastolica}` : "—"}
            <span className="text-base text-muted-foreground font-sans font-normal">
              {" "}
              {tension ? "mmHg" : ""}
            </span>
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {tension && (
              <span className={`badge badge-${tClass.color}`}>
                {tClass.etiqueta}
              </span>
            )}
            {tension ? formatearFecha(tension.fecha) : "Sin registros aún"}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardCheck className="h-4 w-4" />
            <span className="text-sm">Cuestionarios pendientes</span>
          </div>
          <p className="mt-3 text-3xl font-display font-semibold">
            {pendientes?.length ?? 0}
          </p>
          <Link
            href="/cuestionarios"
            className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ir a cuestionarios <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold">Acciones rápidas</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link
            href="/metricas/nueva"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Registrar métrica
          </Link>
          <Link
            href="/biblioteca"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md border bg-card font-medium hover:bg-accent"
          >
            Explorar biblioteca
          </Link>
          <Link
            href="/consultas/nueva"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md border bg-card font-medium hover:bg-accent"
          >
            <MessageCircle className="h-4 w-4" /> Nueva consulta
          </Link>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">
            Consultas recientes
          </h2>
          <Link
            href="/consultas"
            className="text-sm text-primary hover:underline"
          >
            Ver todas
          </Link>
        </div>
        {consultasAbiertas?.length ? (
          <ul className="mt-4 divide-y">
            {consultasAbiertas.map((c) => (
              <li key={c.id} className="py-3">
                <Link
                  href={`/consultas/${c.id}`}
                  className="flex items-center justify-between gap-3 hover:underline"
                >
                  <span className="truncate font-medium">{c.asunto}</span>
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
          <p className="mt-4 text-sm text-muted-foreground">
            Aún no tienes consultas. ¿Tienes alguna duda? ¡Pregunta!
          </p>
        )}
      </div>
    </div>
  );
}
