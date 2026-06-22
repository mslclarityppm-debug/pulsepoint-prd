import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { healthMetrics } from "@/db/schema";
import { and, eq, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const periodo = (searchParams.get("periodo") as "7d" | "30d" | "90d" | "all") || "30d";

    const dias = periodo === 'all' ? null : { '7d': 7, '30d': 30, '90d': 90 }[periodo];

    // Calcular fecha límite si aplica
    const fechaLimite = dias
      ? new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : null;

    // Peso por rangos
    const pesoData = fechaLimite
      ? await db
          .select({
            valor_peso: healthMetrics.valorPeso,
          })
          .from(healthMetrics)
          .where(and(eq(healthMetrics.tipo, "peso"), gte(healthMetrics.fecha, fechaLimite)))
      : await db
          .select({
            valor_peso: healthMetrics.valorPeso,
          })
          .from(healthMetrics)
          .where(eq(healthMetrics.tipo, "peso"));
    const pesoMap = new Map<string, number>();
    for (const row of pesoData ?? []) {
      const kg = (row.valor_peso ?? 0) / 1000;
      let rango: string;
      if (kg < 60) rango = '<60 kg';
      else if (kg < 80) rango = '60-80 kg';
      else if (kg < 100) rango = '80-100 kg';
      else rango = '>100 kg';
      pesoMap.set(rango, (pesoMap.get(rango) || 0) + 1);
    }
    const peso = Array.from(pesoMap.entries()).map(([rango, cantidad]) => ({ rango, cantidad }));

    // Tensión por clasificación
    const tensionData = fechaLimite
      ? await db
          .select({
            sistolica: healthMetrics.sistolica,
            diastolica: healthMetrics.diastolica,
          })
          .from(healthMetrics)
          .where(and(eq(healthMetrics.tipo, "tension"), gte(healthMetrics.fecha, fechaLimite)))
      : await db
          .select({
            sistolica: healthMetrics.sistolica,
            diastolica: healthMetrics.diastolica,
          })
          .from(healthMetrics)
          .where(eq(healthMetrics.tipo, "tension"));
    const tensionMap = new Map<string, number>();
    for (const row of tensionData ?? []) {
      const s = row.sistolica ?? 0;
      const d = row.diastolica ?? 0;
      let clasificacion: string;
      if (s < 120 && d < 80) clasificacion = 'Óptima';
      else if (s < 130 && d < 85) clasificacion = 'Normal';
      else if (s < 140 && d < 90) clasificacion = 'Normal-alta';
      else if (s < 160 && d < 100) clasificacion = 'HTA Grado 1';
      else if (s < 180 && d < 110) clasificacion = 'HTA Grado 2';
      else clasificacion = 'HTA Grado 3';
      tensionMap.set(clasificacion, (tensionMap.get(clasificacion) || 0) + 1);
    }
    const tension = Array.from(tensionMap.entries()).map(([clasificacion, cantidad]) => ({ clasificacion, cantidad }));

    return NextResponse.json({ peso, tension, periodo: dias ?? -1 });
  } catch (error) {
    console.error("[GET /api/reportes/salud]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
