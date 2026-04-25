// Resumen del panel de administración.
import Link from "next/link";
import { count, eq } from "drizzle-orm";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  MessageCircle,
  Users,
} from "lucide-react";
import { db } from "@/db";
import {
  consultations,
  contents,
  questionnaireResponses,
  users,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function contar(tbl: any, where?: any): Promise<number> {
  const r = where
    ? await db.select({ c: count() }).from(tbl).where(where)
    : await db.select({ c: count() }).from(tbl);
  return Number(r?.[0]?.c ?? 0);
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
    </div>
  );
}
