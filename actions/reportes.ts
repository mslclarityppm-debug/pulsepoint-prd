import { requireAdmin } from "@/lib/auth";
import { and, eq, gte, isNull, sql, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users, userProfiles, healthMetrics, consultations, questionnaireResponses, consultationMessages } from "@/db/schema";

// Types for report responses
export interface ReporteUsuariosInactivosData {
  id: number;
  email: string;
  nombre: string | null;
  apellidos: string | null;
  fechaRegistro: string;
}

export interface ReporteUsuariosInactivosResponse {
  data: ReporteUsuariosInactivosData[];
  total: number;
  page: number;
  limit: number;
  totalConMetricas: number;
  totalSinMetricas: number;
  porcentajeSinMetricas: number;
}

export interface ReporteConsultasPendientesData {
  id: number;
  asunto: string;
  fechaCreacion: string;
  estado: string;
  usuarioEmail: string;
  usuarioNombre: string | null;
  totalMensajes: number;
  horasAbierta: number;
}

export interface ReporteConsultasPendientesResponse {
  data: ReporteConsultasPendientesData[];
  total: number;
}

export interface ReporteCuestionariosData {
  id: number;
  email: string;
  nombre: string | null;
  apellidos: string | null;
  fechaRegistro: string;
}

export interface ReporteCuestionariosResponse {
  data: ReporteCuestionariosData[];
  total: number;
}

export interface ReporteSaludResponse {
  peso: Array<{ rango: string; cantidad: number }>;
  tension: Array<{ clasificacion: string; cantidad: number }>;
  periodo: number;
}

// Reporte 1: Usuarios sin métricas
export async function accionReporteUsuariosSinMetricas(params?: {
  segmento?: "0-7d" | "8-30d" | ">90d" | "all";
  page?: number;
  limit?: number;
}): Promise<ReporteUsuariosInactivosResponse> {
  await requireAdmin();

  const { page = 1, limit = 100 } = params || {};

  try {
    // Query for users without health metrics
    const data = await db
      .select({
        id: users.id,
        email: users.email,
        fechaRegistro: users.createdAt,
        nombre: userProfiles.nombre,
        apellidos: userProfiles.apellidos,
      })
      .from(users)
       .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
       .leftJoin(healthMetrics, eq(healthMetrics.userId, users.id))
       .where(and(eq(users.role, 'user'), isNull(healthMetrics.id)))
       .orderBy(desc(users.createdAt));

     // Calculate totals
     const totalUsuarios = await db.$count(users, eq(users.role, 'user'));
     const conMetricasResult = await db
       .select({ count: sql<number>`COUNT(DISTINCT user_id)` })
       .from(healthMetrics);
     const conMetricas = conMetricasResult[0]?.count ?? 0;
     const sinMetricas = totalUsuarios - conMetricas;
     const porcentajeSinMetricas = totalUsuarios > 0 ? Math.round((sinMetricas * 100.0) / totalUsuarios * 10) / 10 : 0;

    return {
      data,
      total: sinMetricas,
      page,
      limit,
      totalConMetricas: conMetricas,
      totalSinMetricas: sinMetricas,
      porcentajeSinMetricas
    };
  } catch (error) {
    console.error('Error in accionReporteUsuariosSinMetricas:', error);
    throw error;
  }
}

export async function accionReporteConsultasPendientes(params?: {
  limit?: number;
}): Promise<ReporteConsultasPendientesResponse> {
  await requireAdmin();

  const { limit = 100 } = params || {};

  try {
    // First get the basic consultation data (without limit to avoid syntax error)
    const basicData = await db
      .select({
        id: consultations.id,
        asunto: consultations.asunto,
        fechaCreacion: consultations.createdAt,
        estado: consultations.estado,
        usuarioEmail: users.email,
        usuarioNombre: userProfiles.nombre,
        createdAt: consultations.createdAt,
      })
      .from(consultations)
      .innerJoin(users, eq(users.id, consultations.userId))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(inArray(consultations.estado, ['abierta', 'en_proceso']))
      .orderBy(consultations.createdAt);
    
    // Calculate additional fields for each consultation
    let resultData = await Promise.all(
      basicData.map(async (consultation) => {
        const [messageCount] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(consultationMessages)
          .where(eq(consultationMessages.consultationId, consultation.id));

        const hoursOpen = Math.round(
          (Date.now() - new Date(consultation.createdAt).getTime()) / (1000 * 60 * 60) * 10
        ) / 10;

        return {
          id: consultation.id,
          asunto: consultation.asunto,
          fechaCreacion: consultation.fechaCreacion,
          estado: consultation.estado,
          usuarioEmail: consultation.usuarioEmail,
          usuarioNombre: consultation.usuarioNombre,
          totalMensajes: messageCount?.count ?? 0,
          horasAbierta: hoursOpen,
        };
      })
    );

    // Apply limit manually if specified
    if (limit && limit > 0) {
      resultData = resultData.slice(0, limit);
    }
    
      return { data: resultData, total: resultData.length };
   } catch (error) {
     console.error('Error in accionReporteConsultasPendientes:', error);
     throw error;
   }
}

export async function accionReporteSalud(params: { periodo: '7d' | '30d' | '90d' | 'all' }): Promise<ReporteSaludResponse> {
  await requireAdmin();
  const { periodo } = params;
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

  return { peso, tension, periodo: dias ?? -1 };
}

// Reporte 3: Usuarios sin cuestionarios
export async function accionReporteCuestionarios(params?: {
  limit?: number;
}): Promise<ReporteCuestionariosResponse> {
  await requireAdmin();

  const { limit = 100 } = params || {};

  try {
    // Query for users without questionnaire responses
    const data = await db
      .select({
        id: users.id,
        email: users.email,
        nombre: userProfiles.nombre,
        apellidos: userProfiles.apellidos,
        fechaRegistro: users.createdAt,
      })
      .from(users)
       .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
       .leftJoin(questionnaireResponses, eq(questionnaireResponses.userId, users.id))
       .where(and(eq(users.role, 'user'), isNull(questionnaireResponses.id)))
       .orderBy(desc(users.createdAt));

    // Apply limit manually if specified
    if (limit && limit > 0) {
      return { data: data.slice(0, limit), total: data.length };
    }
    
    return { data, total: data.length };
  } catch (error) {
    console.error('Error in accionReporteCuestionarios:', error);
    throw error;
  }
}
