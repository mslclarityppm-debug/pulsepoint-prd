// Server Actions para cuestionarios.
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { questionnaireResponses, questionnaires } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { validateCSRFToken } from "@/lib/csrf";
import { recordDailyActivity } from "./achievements";

type Pregunta = {
  id: number;
  texto: string;
  opciones: { texto: string; puntos: number }[];
};

export async function accionEnviarCuestionario(
  questionnaireId: number,
  respuestas: Record<string, number>,
  csrfToken?: string,
): Promise<{ ok: boolean; puntuacion?: number; error?: string }> {
  const user = await requireUser();
  if (!csrfToken || !(await validateCSRFToken(csrfToken))) {
    return { ok: false, error: "Token CSRF inválido" };
  }
  const row = await db
    .select()
    .from(questionnaires)
    .where(eq(questionnaires.id, questionnaireId))
    .limit(1);
  const cuestionario = row?.[0];
  if (!cuestionario) return { ok: false, error: "Cuestionario no encontrado" };

  let preguntas: Pregunta[] = [];
  try {
    preguntas = JSON.parse(cuestionario.preguntasJson ?? "[]");
  } catch {
    return { ok: false, error: "Cuestionario mal formado" };
  }

  let puntuacion = 0;
  for (const p of preguntas) {
    const idx = respuestas[String(p?.id ?? "")];
    if (typeof idx === "number" && p?.opciones?.[idx]) {
      puntuacion += p.opciones[idx]?.puntos ?? 0;
    }
  }

  try {
    await db.insert(questionnaireResponses).values({
      userId: user.id,
      questionnaireId,
      respuestasJson: JSON.stringify(respuestas ?? {}),
      puntuacion,
    });
    // Registrar actividad para streaks
    recordDailyActivity(user.id, { hasQuestionnaire: true }).catch(console.error);
    revalidatePath("/cuestionarios");
    revalidatePath("/panel");
    return { ok: true, puntuacion };
  } catch (e) {
    console.error("[accionEnviarCuestionario]", e);
    return { ok: false, error: "No se pudo guardar la respuesta" };
  }
}
