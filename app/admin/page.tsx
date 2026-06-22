// Resumen del panel de administración.
import { Suspense } from "react";
import { count, eq } from "drizzle-orm";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  MessageCircle,
  Users,
} from "lucide-react";
import Link from "next/link";

import { db } from "@/db";
import {
  consultations,
  contents,
  questionnaireResponses,
  users,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ReporteUsuariosInactivos } from "@/components/admin/reportes/ReporteUsuariosInactivos";
import { ReporteConsultasPendientes } from "@/components/admin/reportes/ReporteConsultasPendientes";
import { ReporteCuestionarios } from "@/components/admin/reportes/ReporteCuestionarios";
import { ReporteSalud } from "@/components/admin/reportes/ReporteSalud";
import { accionReporteUsuariosSinMetricas, accionReporteConsultasPendientes, accionReporteCuestionarios, accionReporteSalud } from "@/actions/reportes";

export const dynamic = "force-dynamic";

// Helper para contar registros en cualquier tabla de Drizzle
async function contar(tbl: unknown, where?: unknown): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = where
    ? db.select({ c: count() }).from(tbl as any).where(where as any)
    : db.select({ c: count() }).from(tbl as any);
  const r = await q;
  return Number(r?.[0]?.c ?? 0);
}

// Carga datos de reportes en paralelo
async function cargarReportes() {
  const [
    usuariosInactivos,
    consultasPendientes,
    cuestionarios,
    salud,
  ] = await Promise.all([
    accionReporteUsuariosSinMetricas({ limit: 100 }),
    accionReporteConsultasPendientes({ limit: 100 }),
    accionReporteCuestionarios({ limit: 100 }),
    accionReporteSalud({ periodo: "30d" }),
  ]);
  return { usuariosInactivos, consultasPendientes, cuestionarios, salud };
}

export default async function AdminPage() {
  await requireAdmin();
  const [totalUsers, totalContenidos, abiertas, totalRespuestas] =
    await Promise.all([
      contar(users, eq(users.role, "user")),
      contar(contents),
      contar(consultations, eq(consultations.estado, "abierta")),
      contar(questionnaireResponses),
    ]);

  // Cargar datos de reportes
  const { usuariosInactivos, consultasPendientes, cuestionarios, salud } = await cargarReportes();

  const tarjetas = [
    {
      Icon: Users,
      label: "Usuarios",
      valor: totalUsers,
      href: "/admin/usuarios",
    },
    {
      Icon: MessageCircle,
      label: "Consultas abiertas",
      valor: abiertas,
      href: "/admin/consultas",
    },
    {
      Icon: BookOpen,
      label: "Contenidos",
      valor: totalContenidos,
      href: "/admin/contenidos",
    },
    {
      Icon: ClipboardCheck,
      label: "Respuestas a cuestionarios",
      valor: totalRespuestas,
      href: "/admin",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          Panel de administración
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona usuarios, contenidos y consultas.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map(({ Icon, label, valor, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-lg border bg-card p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
              <span className="text-sm">{label}</span>
            </div>
            <p className="mt-3 text-3xl font-display font-semibold">{valor}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
              Ver <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>

      {/* Sección de Reportes — Todos en paralelo */}
      <div className="space-y-6">
        <h2 className="font-display text-xl font-semibold tracking-tight mt-8">
          Reportes de monitoreo
        </h2>

        <Suspense fallback={<div>Cargando reporte de usuarios inactivos...</div>}>
          <ReporteUsuariosInactivos initialData={usuariosInactivos as any} />
        </Suspense>

        <Suspense fallback={<div>Cargando reporte de consultas pendientes...</div>}>
          <ReporteConsultasPendientes initialData={consultasPendientes as any} />
        </Suspense>

        <Suspense fallback={<div>Cargando reporte de cuestionarios...</div>}>
          <ReporteCuestionarios initialData={cuestionarios as any} />
        </Suspense>

        <Suspense fallback={<div>Cargando reporte de salud...</div>}>
          <ReporteSalud initialData={salud as any} />
        </Suspense>
      </div>
    </div>
  );
}

