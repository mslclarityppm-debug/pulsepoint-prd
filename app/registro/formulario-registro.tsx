"use client";
import { Loader2 } from "lucide-react";
import { accionRegistro, type ActionState } from "@/actions/auth";
import { useAccion, usePending } from "@/lib/use-accion";
import { FormAccion } from "@/components/ui-app/form-accion";

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

      <fieldset className="space-y-2 rounded-md border bg-muted/40 p-3">
        <legend className="text-sm font-medium px-1">Consentimientos</legend>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="consentimientoGdpr"
            className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
          />
          <span>
            Acepto el tratamiento de mis datos personales conforme al RGPD.
          </span>
        </label>
        {e.consentimientoGdpr && (
          <p className="text-xs text-destructive">{e.consentimientoGdpr}</p>
        )}
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="consentimientoSalud"
            className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
          />
          <span>
            Acepto el tratamiento de datos de salud para el seguimiento preventivo.
          </span>
        </label>
        {e.consentimientoSalud && (
          <p className="text-xs text-destructive">{e.consentimientoSalud}</p>
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
