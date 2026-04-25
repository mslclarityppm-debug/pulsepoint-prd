"use client";
import { useEffect, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import {
  accionResponderConsulta,
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
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Send className="h-4 w-4" />
      )}
      Enviar
    </button>
  );
}

export function FormularioMensaje({
  consultationId,
}: {
  consultationId: number;
}) {
  const [estado, ejecutar, pending] = useAccion<ConsultaState>(
    accionResponderConsulta as never,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado?.ok) {
      toast.success("Mensaje enviado");
      formRef.current?.reset();
    } else if (estado?.error) {
      toast.error(estado.error);
    }
  }, [estado]);

  return (
    <FormAccion
      ejecutar={ejecutar}
      pending={pending}
      formRef={formRef}
      className="space-y-3"
    >
      <input type="hidden" name="consultationId" value={consultationId} />
      <label htmlFor="mensaje" className="block text-sm font-medium">
        Tu mensaje
      </label>
      <textarea
        id="mensaje"
        name="mensaje"
        rows={3}
        required
        className="input-base"
        placeholder="Escribe tu respuesta…"
      />
      <div className="flex justify-end">
        <Boton />
      </div>
    </FormAccion>
  );
}
