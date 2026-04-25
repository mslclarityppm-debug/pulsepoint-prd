// Utilidades de formato en español.
export function formatearFecha(fecha: string | Date | null | undefined): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (Number.isNaN(d?.getTime?.())) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatearFechaHora(fecha: string | Date | null | undefined): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (Number.isNaN(d?.getTime?.())) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function pesoGramosAKg(gramos: number | null | undefined): string {
  if (gramos == null) return "—";
  return (gramos / 1000).toFixed(1);
}

export function clasificarTension(
  sistolica: number | null | undefined,
  diastolica: number | null | undefined,
): { etiqueta: string; color: string } {
  const s = sistolica ?? 0;
  const d = diastolica ?? 0;
  if (s === 0 || d === 0) return { etiqueta: "Sin datos", color: "muted" };
  if (s < 120 && d < 80) return { etiqueta: "Óptima", color: "ok" };
  if (s < 130 && d < 85) return { etiqueta: "Normal", color: "ok" };
  if (s < 140 && d < 90)
    return { etiqueta: "Normal-alta", color: "warning" };
  if (s < 160 && d < 100) return { etiqueta: "HTA grado 1", color: "warning" };
  if (s < 180 && d < 110) return { etiqueta: "HTA grado 2", color: "danger" };
  return { etiqueta: "HTA grado 3", color: "danger" };
}
