// Cumplimentar un cuestionario específico.
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { questionnaires } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getCSRFToken } from "@/lib/csrf";

import { CompletarCuestionario } from "./completar-cuestionario";

export const dynamic = "force-dynamic";

type Pregunta = {
  id: number;
  texto: string;
  opciones: { texto: string; puntos: number }[];
};

export default async function CuestionarioPage({
  params,
}: {
  params: { id: string };
}) {
  await requireUser();
  const csrfToken = await getCSRFToken();
  const id = Number(params?.id);
  if (!Number.isFinite(id)) notFound();
  const rows = await db
    .select()
    .from(questionnaires)
    .where(eq(questionnaires.id, id))
    .limit(1);
  const q = rows?.[0];
  if (!q) notFound();

  let preguntas: Pregunta[] = [];
  try {
    preguntas = JSON.parse(q.preguntasJson ?? "[]");
  } catch {
    preguntas = [];
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          {q.titulo}
        </h1>
        <p className="text-muted-foreground mt-1">{q.descripcion}</p>
      </div>
    <CompletarCuestionario
      questionnaireId={q.id}
      preguntas={preguntas}
      csrfToken={csrfToken}
    />
    </div>
  );
}
