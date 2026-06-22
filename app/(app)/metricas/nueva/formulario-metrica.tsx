"use client";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  accionCrearMetrica,
  type MetricaState,
} from "@/actions/metricas";
import { FormAccion } from "@/components/ui-app/form-accion";
import { useAccion, usePending } from "@/lib/use-accion";

function Boton({ label }: { label: string }) {
  const pending = usePending();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending ? "Guardando…" : label}
    </button>
  );
}

export function FormularioMetrica({
  tipoInicial,
  csrfToken,
}: {
  tipoInicial: "peso" | "tension";
  csrfToken: string;
}) {
  const [tipo, setTipo] = useState<"peso" | "tension">(tipoInicial);
  const [estado, ejecutar, pending] = useAccion<MetricaState>(
    accionCrearMetrica as never,
    {},
  );
  const router = useRouter();
  const e = estado?.errores ?? {};
  const hoy = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (estado?.ok) {
      toast.success("Métrica guardada", {
        icon: <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />,
      });
      router.push("/metricas");
    }
  }, [estado?.ok, router]);

  return (
    <FormAccion ejecutar={ejecutar} pending={pending} className="space-y-4">
      <input type="hidden" name="csrf" value={csrfToken} />
      <div>
        <label className="block text-sm font-medium mb-2">Tipo</label>
        <div
          role="radiogroup"
          aria-label="Tipo de métrica"
          className="flex gap-2"
        >
          {([
            { v: "peso", l: "Peso" },
            { v: "tension", l: "Tensión arterial" },
          ] as const).map(({ v, l }) => (
            <label
              key={v}
              className={`flex-1 text-center cursor-pointer px-3 py-2 rounded-md border ${
                tipo === v
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "bg-card hover:bg-accent"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={v}
                className="sr-only"
                checked={tipo === v}
                onChange={() => setTipo(v)}
              />
              <span className="text-sm font-medium">{l}</span>
            </label>
          ))}
        </div>
      </div>

      {tipo === "peso" ? (
        <div>
          <label htmlFor="valorPesoKg" className="block text-sm font-medium mb-1">
            Peso (kg)
          </label>
          <input
            id="valorPesoKg"
            name="valorPesoKg"
            type="number"
            step="0.1"
            min={20}
            max={400}
          required
          className={`input-base ${e?.['valorPesoKg'] ? "input-error" : ""}`}
        />
        {e?.['valorPesoKg'] && (
          <p className="mt-1 text-xs text-destructive">{e['valorPesoKg']}</p>
        )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="sistolica" className="block text-sm font-medium mb-1">
              Sistólica (mmHg)
            </label>
            <input
              id="sistolica"
              name="sistolica"
              type="number"
              min={60}
              max={260}
              required
              className={`input-base ${e?.['sistolica'] ? "input-error" : ""}`}
            />
            {e?.['sistolica'] && (
              <p className="mt-1 text-xs text-destructive">{e['sistolica']}</p>
            )}
          </div>
          <div>
            <label htmlFor="diastolica" className="block text-sm font-medium mb-1">
              Diastólica (mmHg)
            </label>
            <input
              id="diastolica"
              name="diastolica"
              type="number"
              min={30}
              max={180}
              required
              className={`input-base ${e?.['diastolica'] ? "input-error" : ""}`}
            />
            {e?.['diastolica'] && (
              <p className="mt-1 text-xs text-destructive">{e['diastolica']}</p>
            )}
          </div>
          <div>
            <label htmlFor="frecuenciaCardiaca" className="block text-sm font-medium mb-1">
              Frec. cardíaca
            </label>
            <input
              id="frecuenciaCardiaca"
              name="frecuenciaCardiaca"
              type="number"
              min={30}
              max={240}
              className={`input-base ${e?.['frecuenciaCardiaca'] ? "input-error" : ""}`}
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="fecha" className="block text-sm font-medium mb-1">
          Fecha
        </label>
        <input
          id="fecha"
          name="fecha"
          type="date"
          defaultValue={hoy}
          required
          className={`input-base ${e?.['fecha'] ? "input-error" : ""}`}
        />
      </div>
      <div>
        <label htmlFor="notas" className="block text-sm font-medium mb-1">
          Notas (opcional)
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={2}
          className={`input-base ${e?.['notas'] ? "input-error" : ""}`}
        />
      </div>

      {estado?.error && (
        <p
          role="alert"
          className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"
        >
          {estado.error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Boton label="Guardar métrica" />
        <a
          href="/metricas"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </a>
      </div>
    </FormAccion>
  );
}
