"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { accionEnviarCuestionario } from "@/actions/cuestionarios";

type Pregunta = {
  id: number;
  texto: string;
  opciones: { texto: string; puntos: number }[];
};

export function CompletarCuestionario({
  questionnaireId,
  preguntas,
}: {
  questionnaireId: number;
  preguntas: Pregunta[];
}) {
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [resultado, setResultado] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const total = preguntas?.length ?? 0;
  const actual = preguntas?.[paso];

  function elegir(idx: number) {
    if (!actual) return;
    const next = { ...respuestas, [String(actual.id)]: idx };
    setRespuestas(next);
    if (paso + 1 < total) {
      setPaso(paso + 1);
    } else {
      // Enviar
      startTransition(async () => {
        const r = await accionEnviarCuestionario(questionnaireId, next);
        if (r.ok) {
          setResultado(r.puntuacion ?? 0);
          toast.success("Cuestionario enviado");
        } else {
          toast.error(r.error ?? "Error al enviar");
        }
      });
    }
  }

  if (resultado !== null) {
    const max = (preguntas ?? []).reduce((acc, p) => {
      const m = Math.max(0, ...(p?.opciones?.map((o) => o.puntos) ?? [0]));
      return acc + m;
    }, 0);
    const pct = max > 0 ? Math.round((resultado / max) * 100) : 0;
    const color =
      pct >= 70 ? "text-[hsl(var(--success))]" : pct >= 40 ? "text-[hsl(var(--warning))]" : "text-destructive";
    return (
      <div className="rounded-lg border bg-card p-8 shadow-sm text-center">
        <CheckCircle2 className="h-12 w-12 mx-auto text-[hsl(var(--success))]" />
        <h2 className="mt-4 font-display text-2xl font-semibold">
          ¡Cuestionario completado!
        </h2>
        <p className="mt-2 text-muted-foreground">Tu puntuación:</p>
        <p className={`mt-4 font-display text-5xl font-bold ${color}`}>
          {resultado}
          <span className="text-2xl text-muted-foreground">/{max}</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {pct >= 70
            ? "¡Vas por buen camino! Mantén tus hábitos saludables."
            : pct >= 40
              ? "Hay margen de mejora. Revisa la biblioteca para inspirarte."
              : "Te recomendamos consultar contenidos sobre hábitos saludables."}
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => router.push("/cuestionarios")}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={() => router.push("/biblioteca")}
            className="px-4 py-2 rounded-md border bg-card font-medium hover:bg-accent"
          >
            Ver biblioteca
          </button>
        </div>
      </div>
    );
  }

  if (!actual) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm text-sm text-muted-foreground">
        Este cuestionario no tiene preguntas.
      </div>
    );
  }

  const pct = Math.round(((paso + 1) / total) * 100);

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Pregunta {paso + 1} de {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div
        className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <h3 className="mt-6 font-display text-xl font-semibold">{actual.texto}</h3>
      <div className="mt-4 grid gap-2">
        {(actual?.opciones ?? []).map((op, idx) => (
          <button
            key={idx}
            type="button"
            disabled={pending}
            onClick={() => elegir(idx)}
            className="text-left px-4 py-3 rounded-md border bg-card hover:bg-accent transition flex items-center justify-between gap-2 disabled:opacity-60"
          >
            <span>{op?.texto}</span>
            {pending && paso === total - 1 ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronRight className="h-4 w-4 opacity-60" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
