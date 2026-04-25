// Server Actions para gestión del CMS de contenidos (admin).
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contents } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { contenidoSchema } from "@/lib/validaciones";

export type ContenidoState = {
  ok?: boolean;
  error?: string;
  errores?: Record<string, string>;
};

export async function accionCrearContenido(
  _prev: ContenidoState,
  formData: FormData,
): Promise<ContenidoState> {
  await requireAdmin();
  const parsed = contenidoSchema.safeParse({
    tipo: formData.get("tipo"),
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion") ?? "",
    url: formData.get("url"),
    categoria: formData.get("categoria") || undefined,
    orden: formData.get("orden") ?? 0,
    activo: formData.get("activo") === "on",
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
    await db.insert(contents).values({
      tipo: parsed.data.tipo,
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion ?? "",
      url: parsed.data.url,
      categoria: parsed.data.categoria ?? null,
      orden: parsed.data.orden,
      activo: parsed.data.activo,
    });
    revalidatePath("/admin/contenidos");
    revalidatePath("/biblioteca");
    return { ok: true };
  } catch (e) {
    console.error("[accionCrearContenido]", e);
    return { error: "Error al crear contenido" };
  }
}

export async function accionToggleContenido(
  id: number,
  activo: boolean,
): Promise<void> {
  await requireAdmin();
  await db.update(contents).set({ activo }).where(eq(contents.id, id));
  revalidatePath("/admin/contenidos");
  revalidatePath("/biblioteca");
}

export async function accionEliminarContenido(id: number): Promise<void> {
  await requireAdmin();
  await db.delete(contents).where(eq(contents.id, id));
  revalidatePath("/admin/contenidos");
  revalidatePath("/biblioteca");
}
