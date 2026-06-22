"use client";
import { Loader2 } from "lucide-react";
import { accionRegistro, type ActionState } from "@/actions/auth";
import { useAccion, usePending } from "@/lib/use-accion";
import { FormAccion } from "@/components/ui-app/form-accion";
import { useState } from "react";

function Boton() {
  const pending = usePending();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending ? "Creando cuenta…" : "Crear cuenta"}
    </button>
  );
}

export function FormularioRegistro({ csrfToken }: { csrfToken: string }) {
  const [estado, ejecutar, pending] = useAccion<ActionState>(
    accionRegistro as never,
    {},
  );
  const e = estado?.errores ?? {};
  const cls = (k: string) => `input-base ${e?.[k] ? "input-error" : ""}`;
  const [gdprAceptado, setGdprAceptado] = useState(false);

  return (
    <FormAccion ejecutar={ejecutar} pending={pending} className="mt-6 space-y-4">
      <input type="hidden" name="csrf" value={csrfToken} />
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium mb-1">
            Nombre <span aria-hidden className="text-destructive">*</span>
          </label>
          <input id="nombre" name="nombre" required className={cls("nombre")} />
          {e.nombre && <p className="mt-1 text-xs text-destructive">{e.nombre}</p>}
        </div>
        <div>
          <label htmlFor="apellidos" className="block text-sm font-medium mb-1">
            Apellidos
          </label>
          <input id="apellidos" name="apellidos" className={cls("apellidos")} />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email <span aria-hidden className="text-destructive">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={cls("email")}
          placeholder="ej. usuario@morningview.top"
        />
        {e.email && <p className="mt-1 text-xs text-destructive">{e.email}</p>}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Contraseña <span aria-hidden className="text-destructive">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className={cls("password")}
          />
          {e.password && (
            <p className="mt-1 text-xs text-destructive">{e.password}</p>
          )}
        </div>
        <div>
          <label htmlFor="confirmar" className="block text-sm font-medium mb-1">
            Confirmar contraseña{" "}
            <span aria-hidden className="text-destructive">*</span>
          </label>
          <input
            id="confirmar"
            name="confirmar"
            type="password"
            autoComplete="new-password"
            required
            className={cls("confirmar")}
          />
          {e.confirmar && (
            <p className="mt-1 text-xs text-destructive">{e.confirmar}</p>
          )}
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="fechaNacimiento" className="block text-sm font-medium mb-1">
            Fecha nacimiento
          </label>
          <input
            id="fechaNacimiento"
            name="fechaNacimiento"
            type="date"
            className={cls("fechaNacimiento")}
          />
        </div>
        <div>
          <label htmlFor="sexo" className="block text-sm font-medium mb-1">
            Sexo
          </label>
          <select id="sexo" name="sexo" className={cls("sexo")}>
            <option value="">—</option>
            <option value="hombre">Hombre</option>
            <option value="mujer">Mujer</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label htmlFor="telefono" className="block text-sm font-medium mb-1">
            Teléfono
          </label>
          <input id="telefono" name="telefono" className={cls("telefono")} />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-md border bg-muted/40 p-4">
        <legend className="text-sm font-medium px-2">Consentimientos</legend>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="consentimientoGdpr"
            className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))] transition-shadow hover:ring-1 hover:ring-primary/30 focus:ring-2 focus:ring-primary/50"
            disabled={!gdprAceptado}
          />
          <span className="leading-relaxed">
            <span className="text-muted-foreground">Acepto el tratamiento de mis datos personales</span>{" "}
            <a
              href="https://www.unilibre.edu.co/wp-content/uploads/2025/01/Resolucion-20-22-Marco-Regulatorio-de-Proteccion-de-Datos-Personales.pdf"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setGdprAceptado(true)}
              className="inline-flex items-center gap-1 font-medium underline decoration-primary/30 underline-offset-2 transition-all hover:decoration-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
            >
              leer aquí
              <svg
                className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </span>
        </label>
        {e.consentimientoGdpr && (
          <p className="text-xs text-destructive flex items-start gap-1.5">
            <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2}/>
              <path strokeWidth={2} d="M12 8v4m0 4h.01"/>
            </svg>
            {e.consentimientoGdpr}
          </p>
        )}
        <label className="flex items-start gap-3 text-sm cursor-pointer group">
          <input
            type="checkbox"
            name="consentimientoSalud"
            className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))] transition-shadow hover:ring-1 hover:ring-primary/30 focus:ring-2 focus:ring-primary/50"
          />
          <span className="leading-relaxed">
            Acepto el tratamiento de mis datos de salud para el seguimiento preventivo y la gestión de métricas personales.
          </span>
        </label>
        {e.consentimientoSalud && (
          <p className="text-xs text-destructive flex items-start gap-1.5">
            <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2}/>
              <path strokeWidth={2} d="M12 8v4m0 4h.01"/>
            </svg>
            {e.consentimientoSalud}
          </p>
        )}
      </fieldset>

      {estado?.error && !estado?.errores && (
        <p role="alert" className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {estado.error}
        </p>
      )}
      <Boton />
    </FormAccion>
  );
}
