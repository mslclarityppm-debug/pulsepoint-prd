// Server Actions para métricas de salud.
"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { healthMetrics } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { metricaSchema } from "@/lib/validaciones";

export type MetricaState = {
  ok?: boolean;
  error?: string;
  errores?: Record<string, string>;
};

export async function accionCrearMetrica(
  _prev: MetricaState,
  formData: FormData,
): Promise<MetricaState> {
  const user = await requireUser();
  const tipo = String(formData.get("tipo") ?? "");

  const raw = {
    tipo,
    valorPesoKg: formData.get("valorPesoKg"),
    sistolica: formData.get("sistolica"),
    diastolica: formData.get("diastolica"),
    frecuenciaCardiaca: formData.get("frecuenciaCardiaca") || undefined,
    fecha: formData.get("fecha"),
    notas: (formData.get("notas") ?? "") as string,
  };
  const parsed = metricaSchema.safeParse(raw);
  if (!parsed.success) {
    const errores: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path?.[0] ?? "_");
      if (!errores[key]) errores[key] = issue.message;
    }
    return { error: "Revisa los datos", errores };
  }
  const d = parsed.data;
  try {
    if (d.tipo === "peso") {
      await db.insert(healthMetrics).values({
        userId: user.id,
        tipo: "peso",
        valorPeso: Math.round(d.valorPesoKg * 1000),
        fecha: d.fecha,
        notas: d.notas ?? null,
      });
    } else {
      await db.insert(healthMetrics).values({
        userId: user.id,
        tipo: "tension",
        sistolica: d.sistolica,
        diastolica: d.diastolica,
        frecuenciaCardiaca: d.frecuenciaCardiaca ?? null,
        fecha: d.fecha,
        notas: d.notas ?? null,
      });
    }
    revalidatePath("/panel");
    revalidatePath("/metricas");
    return { ok: true };
  } catch (e) {
    console.error("[accionCrearMetrica]", e);
    return { error: "No se pudo guardar la métrica" };
  }
}

export async function accionEliminarMetrica(id: number): Promise<void> {
  const user = await requireUser();
  await db
    .delete(healthMetrics)
    .where(and(eq(healthMetrics.id, id), eq(healthMetrics.userId, user.id)));
  revalidatePath("/metricas");
  revalidatePath("/panel");
}
