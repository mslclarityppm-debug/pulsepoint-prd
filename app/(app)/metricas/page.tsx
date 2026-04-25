// Listado de métricas + gráficos de evolución (peso y tensión).
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { Plus, Trash2 } from "lucide-react";
import { db } from "@/db";
import { healthMetrics } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { accionEliminarMetrica } from "@/actions/metricas";
import {
  clasificarTension,
  formatearFecha,
  pesoGramosAKg,
} from "@/lib/formato";
import { GraficoEvolucion } from "@/components/ui-app/grafico-metrica";

export const dynamic = "force-dynamic";

export default async function MetricasPage() {
  const user = await requireUser();

  const pesos = await db
    .select()
    .from(healthMetrics)
    .where(
      and(eq(healthMetrics.userId, user.id), eq(healthMetrics.tipo, "peso")),
    )
    .orderBy(asc(healthMetrics.fecha));

  const tensiones = await db
    .select()
    .from(healthMetrics)
    .where(
      and(eq(healthMetrics.userId, user.id), eq(healthMetrics.tipo, "tension")),
    )
    .orderBy(asc(healthMetrics.fecha));

  const datosPeso = (pesos ?? []).map((p) => ({
    fecha: formatearFecha(p.fecha).replace(/ \d{4}/, ""),
    peso: (p.valorPeso ?? 0) / 1000,
  }));
  const datosTension = (tensiones ?? []).map((t) => ({
    fecha: formatearFecha(t.fecha).replace(/ \d{4}/, ""),
    sistolica: t.sistolica ?? 0,
    diastolica: t.diastolica ?? 0,
  }));

  // Lista combinada para tabla, ordenada por fecha desc
  const todas = [...(pesos ?? []), ...(tensiones ?? [])].sort((a, b) =>
    a.fecha < b.fecha ? 1 : -1,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            Métricas de salud
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualiza tu evolución y registra nuevos valores.
          </p>
        </div>
        <Link
          href="/metricas/nueva"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nueva métrica
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold mb-3">Peso (kg)</h2>
          <GraficoEvolucion datos={datosPeso} tipo="peso" />
        </section>
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold mb-3">
            Tensión arterial (mmHg)
          </h2>
          <GraficoEvolucion datos={datosTension} tipo="tension" />
        </section>
      </div>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold mb-4">Historial</h2>
        {todas?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3">Valor</th>
                  <th className="py-2 pr-3">Notas</th>
                  <th className="py-2 pr-3 sr-only">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {todas.map((m) => {
                  const cls =
                    m.tipo === "tension"
                      ? clasificarTension(m.sistolica, m.diastolica)
                      : null;
                  return (
                    <tr key={m.id} className="border-t">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {formatearFecha(m.fecha)}
                      </td>
                      <td className="py-2 pr-3 capitalize">{m.tipo}</td>
                      <td className="py-2 pr-3 font-mono">
                        {m.tipo === "peso" ? (
                          <>{pesoGramosAKg(m.valorPeso)} kg</>
                        ) : (
                          <>
                            {m.sistolica}/{m.diastolica}
                            {m.frecuenciaCardiaca
                              ? ` · ${m.frecuenciaCardiaca} ppm`
                              : ""}
                            {cls && (
                              <span
                                className={`ml-2 badge badge-${cls.color}`}
                              >
                                {cls.etiqueta}
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {m.notas ?? "—"}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <form
                          action={async () => {
                            "use server";
                            await accionEliminarMetrica(m.id);
                          }}
                        >
                          <button
                            type="submit"
                            aria-label="Eliminar"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-destructive/10 text-destructive"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Aún no has registrado métricas. Empieza con tu primera medición.
          </p>
        )}
      </section>
    </div>
  );
}
