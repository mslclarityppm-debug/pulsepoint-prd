// Crear nueva consulta.
import { requireUser } from "@/lib/auth";
import { FormularioNuevaConsulta } from "./formulario-nueva-consulta";

export const dynamic = "force-dynamic";

export default async function NuevaConsultaPage() {
  await requireUser();
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          Nueva consulta
        </h1>
        <p className="text-muted-foreground mt-1">
          Explica tu duda. Te responderemos en un plazo aproximado de 48h
          laborables.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <FormularioNuevaConsulta />
      </div>
    </div>
  );
}
