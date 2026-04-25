"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  accionCrearConsulta,
  type ConsultaState,
} from "@/actions/consultas";
import { useAccion, usePending } from "@/lib/use-accion";
import { FormAccion } from "@/components/ui-app/form-accion";

function Boton() {
  const pending = usePending();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Enviando…" : "Enviar consulta"}
    </button>
  );
}

export function FormularioNuevaConsulta() {
  const [estado, ejecutar, pending] = useAccion<ConsultaState>(
    accionCrearConsulta as never,
    {},
  );
  const router = useRouter();
  const e = estado?.errores ?? {};

  useEffect(() => {
    if (estado?.ok && estado?.id) {
      toast.success("Consulta enviada");
      router.push(`/consultas/${estado.id}`);
    }
  }, [estado?.ok, estado?.id, router]);

  return (
    <FormAccion ejecutar={ejecutar} pending={pending} className="space-y-4">
      <div>
        <label htmlFor="asunto" className="block text-sm font-medium mb-1">
          Asunto
        </label>
        <input
          id="asunto"
          name="asunto"
          required
          className={`input-base ${e?.asunto ? "input-error" : ""}`}
        />
        {e?.asunto && (
          <p className="mt-1 text-xs text-destructive">{e.asunto}</p>
        )}
      </div>
      <div>
        <label htmlFor="mensaje" className="block text-sm font-medium mb-1">
          Mensaje
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          rows={5}
          required
          className={`input-base ${e?.mensaje ? "input-error" : ""}`}
        />
        {e?.mensaje && (
          <p className="mt-1 text-xs text-destructive">{e.mensaje}</p>
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
      <div className="flex items-center gap-3">
        <Boton />
        <a
          href="/consultas"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </a>
      </div>
    </FormAccion>
  );
}
