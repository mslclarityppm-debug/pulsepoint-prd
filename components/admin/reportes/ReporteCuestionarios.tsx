"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ReporteCuestionariosResponse, ReporteCuestionariosData } from "@/actions/reportes";

interface ReporteCuestionariosProps {
  initialData: ReporteCuestionariosResponse;
}

export function ReporteCuestionarios({ initialData }: ReporteCuestionariosProps) {
  const data = initialData?.data || [];

  if (!initialData || !Array.isArray(data)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usuarios sin cuestionarios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Error al cargar los datos del reporte.</p>
        </CardContent>
      </Card>
    );
  }

  const exportarCSV = () => {
    const headers = ["Email", "Nombre", "Registro"];
    const rows = data.map((r: ReporteCuestionariosData) => [
      r.email,
      `${r.nombre || ""} ${r.apellidos || ""}`.trim() || "—",
      new Date(r.fechaRegistro).toLocaleDateString("es-ES")
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios_sin_cuestionarios_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Usuarios sin cuestionarios</CardTitle>
          <Button size="sm" variant="outline" onClick={exportarCSV}>
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Registro</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r: ReporteCuestionariosData) => (
                <tr key={r.id} className="border-t hover:bg-muted/50">
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">
                    {r.nombre || ""} {r.apellidos || ""}
                  </td>
                  <td className="p-3">{new Date(r.fechaRegistro).toLocaleDateString("es-ES")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}