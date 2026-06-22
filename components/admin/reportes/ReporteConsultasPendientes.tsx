"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ReporteConsultasPendientesResponse, ReporteConsultasPendientesData } from "@/actions/reportes";

interface ReporteConsultasPendientesProps {
  initialData: ReporteConsultasPendientesResponse;
}

export function ReporteConsultasPendientes({ initialData }: ReporteConsultasPendientesProps) {
  const data = initialData?.data || [];

  if (!initialData || !Array.isArray(data)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consultas pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Error al cargar los datos del reporte.</p>
        </CardContent>
      </Card>
    );
  }

  const exportarCSV = () => {
    const headers = ["ID", "Asunto", "Usuario", "Estado", "Horas abierta"];
    const rows = data.map((r: ReporteConsultasPendientesData) => [r.id, r.asunto, r.usuarioEmail, r.estado, `${r.horasAbierta.toFixed(1)}h`]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consultas_pendientes_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const consultasAbiertas = data.filter((r: ReporteConsultasPendientesData) => r.estado === "abierta");

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Consultas pendientes</CardTitle>
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground">
              {consultasAbiertas.length} abiertas
            </span>
            <Button size="sm" variant="outline" onClick={exportarCSV}>
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Asunto</th>
                <th className="text-left p-3">Usuario</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-left p-3">Horas</th>
                <th className="text-left p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r: ReporteConsultasPendientesData) => (
                <tr key={r.id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                  <td className="p-3 max-w-xs truncate" title={r.asunto}>
                    {r.asunto}
                  </td>
                  <td className="p-3">{r.usuarioEmail}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        r.estado === "abierta"
                          ? "bg-red-100 text-red-800"
                          : r.estado === "en_proceso"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {r.estado === "abierta"
                        ? "Abierta"
                        : r.estado === "en_proceso"
                        ? "En proceso"
                        : "Cerrada"}
                    </span>
                  </td>
                  <td className="p-3">{r.horasAbierta.toFixed(1)}h</td>
                  <td className="p-3">
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/admin/consultas/${r.id}`}>Ver</a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}