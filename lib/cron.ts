// Sistema de alertas automáticas por email para administradores.
// Se ejecuta como proceso separado (no en request/response).
// Para producción en Vercel, usar Ver
// NOTA: En desarrollo, ejecutar manualmente: `npx tsx lib/cron.ts`
import cron from "node-cron";
import nodemailer from "nodemailer";
import { db } from "@/db";
import { users, consultations, healthMetrics, questionnaireResponses } from "@/db/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { env } from "@/lib/env";

// ——— Configuración ———
const HORA_DIARIA = "0 8 * * *"; // 8:00 AM todos los días
const HORA_SEMANAL = "0 9 * * 1"; // 9:00 AM todos los lunes

// ——— Transporte de email ———
let transporter: nodemailer.Transporter | null = null;
if (env.EMAIL_SMTP_HOST && env.EMAIL_SMTP_USER && env.EMAIL_SMTP_PASS && env.EMAIL_FROM) {
  transporter = nodemailer.createTransport({
    host: env.EMAIL_SMTP_HOST,
    port: env.EMAIL_SMTP_PORT,
    secure: env.EMAIL_SMTP_PORT === 465,
    auth: {
      user: env.EMAIL_SMTP_USER,
      pass: env.EMAIL_SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: true,
      minVersion: "TLSv1.2",
    },
  });
}

// ——— Helpers ———

async function obtenerAdmins() {
  return await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.role, "admin"));
}

async function obtenerConsultasPendientes() {
  return await db
    .select({
      totalAbiertas: sql<number>`SUM(CASE WHEN estado = 'abierta' THEN 1 ELSE 0 END)`,
      totalEnProceso: sql<number>`SUM(CASE WHEN estado = 'en_proceso' THEN 1 ELSE 0 END)`,
      horasPromedio: sql<number>`AVG((JULIANDAY('now') - JULIANDAY(createdAt)) * 24)`,
    })
    .from(consultations)
    .where(inArray(consultations.estado, ['abierta', 'en_proceso']));
}

async function obtenerUsuariosSinMetricas() {
  const [total] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(users)
    .where(eq(users.role, "user"));
  const [conMetricas] = await db
    .select({ count: sql<number>`COUNT(DISTINCT health_metrics.user_id)` })
    .from(healthMetrics); // asumiendo tabla healthMetrics

  const totalCount = total?.total ?? 0;
  const conMetricasCount = conMetricas?.count ?? 0;
  const sinMetricas = totalCount - conMetricasCount;
  const porcentaje = totalCount > 0 ? (sinMetricas * 100.0) / totalCount : 0;
  return { total: totalCount, sinMetricas, porcentaje };
}

async function obtenerUsuariosSinCuestionarios() {
  const [total] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(users)
    .where(eq(users.role, "user"));
  const [conCuestionarios] = await db
    .select({ count: sql<number>`COUNT(DISTINCT questionnaire_responses.user_id)` })
    .from(questionnaireResponses);

  const totalCount = total?.total ?? 0;
  const conCuestionariosCount = conCuestionarios?.count ?? 0;
  const sinCuestionarios = totalCount - conCuestionariosCount;
  const porcentaje = totalCount > 0 ? (sinCuestionarios * 100.0) / totalCount : 0;
  return { total: totalCount, sinCuestionarios, porcentaje };
}

function construirHTMLDiario(consultasPend: any, sinMetr: any, sinCuestion: any) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
      <h2>📊 Resumen Diario — Pulse Point</h2>
      <p>Reporte automático del <strong>${new Date().toLocaleDateString("es-ES")}</strong></p>
      
      <h3>🔔 Consultas pendientes</h3>
      <ul>
        <li><strong>Abiertas:</strong> ${consultasPend.totalAbiertas ?? 0}</li>
        <li><strong>En proceso:</strong> ${consultasPend.totalEnProceso ?? 0}</li>
        <li><strong>Tiempo promedio abiertas:</strong> ${(consultasPend.horasPromedio ?? 0).toFixed(1)}h</li>
      </ul>
      
      <h3>👥 Usuarios sin métricas</h3>
      <ul>
        <li><strong>Total:</strong> ${sinMetr.sinMetricas} (${sinMetr.porcentaje.toFixed(1)}%)</li>
      </ul>
      
      <h3>📝 Usuarios sin cuestionarios</h3>
      <ul>
        <li><strong>Total:</strong> ${sinCuestion.sinCuestionarios} (${sinCuestion.porcentaje.toFixed(1)}%)</li>
      </ul>
      
      <hr />
      <p style="color: #666; font-size: 12px;">
        Este es un reporte automático. Para más detalles, ingresa al <a href="${env.APP_URL || "http://localhost:3000"}/admin">panel de administración</a>.
      </p>
    </div>
  `;
}

async function enviarEmailDiario() {
  if (!transporter || !env.EMAIL_FROM) {

    return;
  }

  const admins = await obtenerAdmins();
  const [consultasPend, sinMetricas, sinCuestionarios] = await Promise.all([
    obtenerConsultasPendientes(),
    obtenerUsuariosSinMetricas(),
    obtenerUsuariosSinCuestionarios(),
  ]);

  const html = construirHTMLDiario(consultasPend, sinMetricas, sinCuestionarios);

  for (const admin of admins) {
    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: admin.email,
        subject: `[Pulse Point] Reporte diario — ${new Date().toLocaleDateString("es-ES")}`,
        html,
      });

    } catch {

    }
  }
}

async function enviarReporteSemanal() {
  if (!transporter || !env.EMAIL_FROM) {

    return;
  }

  const admins = await obtenerAdmins();
  // Similar al diario pero con más métricas y gráficos
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
      <h2>📈 Reporte Semanal — Pulse Point</h2>
      <p>Resumen de la semana terminada el ${new Date().toLocaleDateString("es-ES")}</p>
      <p>Más detalles en <a href="${env.APP_URL || "http://localhost:3000"}/admin">panel de administración</a>.</p>
    </div>
  `;

  for (const admin of admins) {
    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: admin.email,
        subject: `[Pulse Point] Reporte semanal — ${new Date().toLocaleDateString("es-ES")}`,
        html,
      });

    } catch {

    }
  }
}

// ——— Inicialización de cron jobs ———
export function iniciarCron() {
  if (process.env.ENABLE_DAILY_REPORTS !== "true") {

    return;
  }



  // Job diario 8am
  cron.schedule(HORA_DIARIA, async () => {

    await enviarEmailDiario();
  });

  // Job semanal lunes 9am
  cron.schedule(HORA_SEMANAL, async () => {

    await enviarReporteSemanal();
  });


}

// Para ejecución manual (desarrollo)
if (import.meta.url === `file://${process.argv[1]}`) {
  iniciarCron();
}
