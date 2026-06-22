"use client";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import {
  accionCrearContenido,
  type ContenidoState,
} from "@/actions/contenidos";
import { FormAccion } from "@/components/ui-app/form-accion";
import { useAccion, usePending } from "@/lib/use-accion";

function Boton() {
  const pending = usePending();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Guardando…" : "Añadir contenido"}
    </button>
  );
}

export function FormularioContenido({ csrfToken }: { csrfToken: string }) {
  const [estado, ejecutar, pending] = useAccion<ContenidoState>(
    accionCrearContenido as never,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  const e = estado?.errores ?? {};

  useEffect(() => {
    if (estado?.ok) {
      toast.success("Contenido creado");
      ref.current?.reset();
    }
  }, [estado?.ok]);

  return (
    <FormAccion
      ejecutar={ejecutar}
      pending={pending}
      formRef={ref}
      className="space-y-3"
    >
      <input type="hidden" name="csrf" value={csrfToken} />
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="tipo" className="block text-sm font-medium mb-1">
            Tipo
          </label>
          <select id="tipo" name="tipo" required className={`input-base ${e?.['tipo'] ? "input-error" : ""}`}>
            <option value="video">Vídeo</option>
            <option value="infografia">Infografía</option>
            <option value="articulo">Artículo</option>
          </select>
        </div>
        <div>
          <label htmlFor="categoria" className="block text-sm font-medium mb-1">
            Categoría
          </label>
          <select id="categoria" name="categoria" className="input-base">
            <option value="">—</option>
            <option value="sueno">Sueño</option>
            <option value="tension">Tensión</option>
            <option value="colesterol">Colesterol</option>
            <option value="dieta">Dieta</option>
            <option value="actividad_fisica">Actividad física</option>
            <option value="tabaco">Tabaco / vapeo</option>
            <option value="peso">Peso</option>
            <option value="glucosa">Glucosa</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="titulo" className="block text-sm font-medium mb-1">
          Título
        </label>
        <input id="titulo" name="titulo" required className={`input-base ${e?.['titulo'] ? "input-error" : ""}`} />
        {e?.['titulo'] && <p className="mt-1 text-xs text-destructive">{e['titulo']}</p>}
      </div>
      <div>
        <label htmlFor="url" className="block text-sm font-medium mb-1">
          URL
        </label>
        <input id="url" name="url" type="url" required className={`input-base ${e?.['url'] ? "input-error" : ""}`} />
        {e?.['url'] && <p className="mt-1 text-xs text-destructive">{e['url']}</p>}
      </div>
      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium mb-1">
          Descripción
        </label>
        <textarea id="descripcion" name="descripcion" rows={2} className="input-base" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="orden" className="block text-sm font-medium mb-1">
            Orden
          </label>
          <input id="orden" name="orden" type="number" min={0} defaultValue={0} className="input-base" />
        </div>
        <label className="flex items-end gap-2 text-sm pb-2">
          <input type="checkbox" name="activo" defaultChecked className="h-4 w-4 accent-[hsl(var(--primary))]" />
          <span>Activo (visible en biblioteca)</span>
        </label>
      </div>
      {estado?.error && (
        <p role="alert" className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {estado.error}
        </p>
      )}
      <Boton />
    </FormAccion>
  );
}
