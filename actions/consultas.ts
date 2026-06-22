// Server Actions para consultas (tickets) y mensajes.
"use server";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  consultationMessages,
  consultations,
} from "@/db/schema";
import { requireUser, requireAdmin } from "@/lib/auth";
import { validateCSRFToken } from "@/lib/csrf";
import {
  consultaMensajeSchema,
  consultaNuevaSchema,
} from "@/lib/validaciones";

export type ConsultaState = {
  ok?: boolean;
  error?: string;
  errores?: Record<string, string>;
  id?: number;
};

export async function accionCrearConsulta(
  _prev: ConsultaState,
  formData: FormData,
): Promise<ConsultaState> {
  const user = await requireUser();
  const csrfToken = formData.get('csrf') as string;
  if (!(await validateCSRFToken(csrfToken))) {
    return { error: "Token CSRF inválido" };
  }
  const parsed = consultaNuevaSchema.safeParse({
    asunto: formData.get("asunto"),
    mensaje: formData.get("mensaje"),
  });
  if (!parsed.success) {
    const errores: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path?.[0] ?? "_");
      if (!errores[key]) errores[key] = issue.message;
    }
    return { error: "Revisa los campos", errores };
  }
  try {
    const inserted = await db
      .insert(consultations)
      .values({
        userId: user.id,
        asunto: parsed.data.asunto,
        mensajeInicial: parsed.data.mensaje,
        estado: "abierta",
      })
      .returning({ id: consultations.id });
    const consultationId = inserted?.[0]?.id;
    if (!consultationId) return { error: "No se pudo crear la consulta" };

    await db.insert(consultationMessages).values({
      consultationId,
      userId: user.id,
      mensaje: parsed.data.mensaje,
      esAdmin: false,
    });
    revalidatePath("/consultas");
    revalidatePath("/admin/consultas");
    return { ok: true, id: consultationId };
  } catch (e) {
    console.error("[accionCrearConsulta]", e);
    return { error: "Error al guardar la consulta" };
  }
}

export async function accionResponderConsulta(
  _prev: ConsultaState,
  formData: FormData,
): Promise<ConsultaState> {
  const user = await requireUser();
  const csrfToken = formData.get('csrf') as string;
  if (!(await validateCSRFToken(csrfToken))) {
    return { error: "Token CSRF inválido" };
  }
  const parsed = consultaMensajeSchema.safeParse({
    consultationId: formData.get("consultationId"),
    mensaje: formData.get("mensaje"),
  });
  if (!parsed.success) {
    return { error: "Revisa el mensaje" };
  }
  const { consultationId, mensaje } = parsed.data;

  // Verificar permisos: el propietario o un admin pueden responder.
  const cons = await db
    .select()
    .from(consultations)
    .where(eq(consultations.id, consultationId))
    .limit(1);
  const c = cons?.[0];
  if (!c) return { error: "Consulta no encontrada" };
  if (c.userId !== user.id && user.role !== "admin") {
    return { error: "Sin permiso para responder" };
  }

  try {
    await db.insert(consultationMessages).values({
      consultationId,
      userId: user.id,
      mensaje,
      esAdmin: user.role === "admin",
    });
    // Actualizar estado / timestamp
    await db
      .update(consultations)
      .set({
        updatedAt: sql`CURRENT_TIMESTAMP`,
        estado:
          user.role === "admin" && c.estado === "abierta"
            ? "en_proceso"
            : c.estado,
      })
      .where(eq(consultations.id, consultationId));
    revalidatePath(`/consultas/${consultationId}`);
    revalidatePath("/consultas");
    revalidatePath("/admin/consultas");
    revalidatePath(`/admin/consultas/${consultationId}`);
    return { ok: true };
  } catch (e) {
    console.error("[accionResponderConsulta]", e);
    return { error: "Error al enviar mensaje" };
  }
}

export async function accionCerrarConsulta(id: number): Promise<void> {
  await requireAdmin();
  await db
    .update(consultations)
    .set({ estado: "cerrada", updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(consultations.id, id));
  revalidatePath(`/admin/consultas/${id}`);
  revalidatePath("/admin/consultas");
  revalidatePath("/consultas");
}
