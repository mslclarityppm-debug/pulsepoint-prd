"use client";
import { Loader2 } from "lucide-react";
import { accionForgotPassword, type ActionState } from "@/actions/auth";
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
      {pending ? "Enviando…" : "Enviar enlace"}
    </button>
  );
}

export function FormularioForgotPassword({ csrfToken }: { csrfToken: string }) {
  const [estado, ejecutar, pending] = useAccion<ActionState>(
    accionForgotPassword as never,
    {},
  );
  const errores = estado?.errores ?? {};
  return (
    <FormAccion ejecutar={ejecutar} pending={pending} className="mt-6 space-y-4">
      <input type="hidden" name="csrf" value={csrfToken} />
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={`input-base ${errores?.email ? "input-error" : ""}`}
        />
        {errores?.email && (
          <p className="mt-1 text-xs text-destructive">{errores.email}</p>
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
      {estado?.ok && (
        <p
          role="alert"
          className="text-sm text-green-600 bg-green-50 rounded-md px-3 py-2"
        >
          Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
        </p>
      )}
      <Boton />
    </FormAccion>
  );
}