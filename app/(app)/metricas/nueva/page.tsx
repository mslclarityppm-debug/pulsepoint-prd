// Página para registrar una nueva métrica (peso o tensión).
import { FormularioMetrica } from "./formulario-metrica";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NuevaMetricaPage({
  searchParams,
}: {
  searchParams?: { tipo?: string };
}) {
  await requireUser();
  const tipoInicial =
    searchParams?.tipo === "tension" ? "tension" : "peso";
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          Nueva métrica
        </h1>
        <p className="text-muted-foreground mt-1">
          Selecciona el tipo y registra tus valores.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <FormularioMetrica tipoInicial={tipoInicial} />
      </div>
    </div>
  );
}
