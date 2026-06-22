"use client";
import { Loader2 } from "lucide-react";

import { accionResetPassword, type ActionState } from "@/actions/auth";
import { FormAccion } from "@/components/ui-app/form-accion";
import { useAccion, usePending } from "@/lib/use-accion";

function Boton() {
  const pending = usePending();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending ? "Actualizando…" : "Restablecer contraseña"}
    </button>
  );
}

interface FormularioResetPasswordProps {
  csrfToken: string;
  token: string;
}

export function FormularioResetPassword({ csrfToken, token }: FormularioResetPasswordProps) {
  const [estado, ejecutar, pending] = useAccion<ActionState>(
    accionResetPassword as never,
    {},
  );
  const errores = estado?.errores ?? {};
  return (
    <FormAccion ejecutar={ejecutar} pending={pending} className="mt-6 space-y-4">
      <input type="hidden" name="csrf" value={csrfToken} />
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Nueva contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className={`input-base ${errores?.['password'] ? "input-error" : ""}`}
        />
        {errores?.['password'] && (
          <p className="mt-1 text-xs text-destructive">{errores['password']}</p>
        )}
      </div>
      <div>
        <label htmlFor="confirmar" className="block text-sm font-medium mb-1">
          Confirmar contraseña
        </label>
        <input
          id="confirmar"
          name="confirmar"
          type="password"
          autoComplete="new-password"
          required
          className={`input-base ${errores?.['confirmar'] ? "input-error" : ""}`}
        />
        {errores?.['confirmar'] && (
          <p className="mt-1 text-xs text-destructive">{errores['confirmar']}</p>
        )}
      </div>
      {estado?.error && !estado?.errores && (
        <p
          role="alert"
          className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"
        >
          {estado.error}
        </p>
      )}
      <Boton />
    </FormAccion>
  );
}