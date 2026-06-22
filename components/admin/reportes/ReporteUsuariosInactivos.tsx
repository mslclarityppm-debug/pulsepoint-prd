"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ReporteUsuariosInactivosData, ReporteUsuariosInactivosResponse } from "@/actions/reportes";

interface ReporteUsuariosInactivosProps {
  initialData: ReporteUsuariosInactivosResponse;
}

export function ReporteUsuariosInactivos({ initialData }: ReporteUsuariosInactivosProps) {
  const [data] = useState<ReporteUsuariosInactivosData[]>(initialData?.data || []);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  // Export CSV
  const exportarCSV = () => {
    const headers = ["Email", "Nombre", "Registro", "Días inactivo"];
    const rows = data.map(row => [
      row.email,
      `${row.nombre || ""} ${row.apellidos || ""}`.trim() || "—",
      new Date(row.fechaRegistro).toLocaleDateString("es-ES"),
      Math.floor((Date.now() - new Date(row.fechaRegistro).getTime()) / (1000 * 60 * 60 * 24)).toString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios_inactivos_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF
  const exportarPDF = useCallback(async () => {
    setGenerandoPDF(true);
    try {
      // Importar dinámicamente para evitar problemas de SSR
      await import("@react-pdf/renderer");

      // Crear el documento como string HTML para simplificar
      const generatePDF = () => {
        const html = `
          <html>
            <head>
              <meta charset="utf-8">
              <title>Usuarios sin métricas</title>
              <style>
                body { font-family: sans-serif; padding: 40px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f0f0f0; font-weight: bold; }
              </style>
            </head>
            <body>
              <h1>Usuarios sin métricas registradas</h1>
              <p>Generado el: ${new Date().toLocaleDateString("es-ES")}</p>
              <p>Total: ${data.length} usuarios</p>
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Nombre</th>
                    <th>Registro</th>
                    <th>Días inactivo</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.map(row => `
                    <tr>
                      <td>${row.email}</td>
                      <td>${row.nombre || ""} ${row.apellidos || ""}</td>
                      <td>${new Date(row.fechaRegistro).toLocaleDateString("es-ES")}</td>
                      <td>${Math.floor((Date.now() - new Date(row.fechaRegistro).getTime()) / (1000 * 60 * 60 * 24))}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </body>
          </html>
        `;
        return html;
      };

      // Usar window.print() para imprimir a PDF (solución simple compatible)
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(generatePDF());
        printWindow.document.close();
        printWindow.focus();
        // Esperar a que cargue el contenido
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    } catch (error) {
      console.error("Error generando PDF:", error);
    } finally {
      setGenerandoPDF(false);
    }
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Usuarios sin métricas registradas</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {initialData.totalSinMetricas} de {initialData.totalConMetricas + initialData.totalSinMetricas} usuarios ({initialData.porcentajeSinMetricas}%)
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportarCSV}>CSV</Button>
            <Button size="sm" variant="outline" onClick={exportarPDF} disabled={generandoPDF}>
              {generandoPDF ? 'Generando...' : 'PDF'}
            </Button>
          </div>
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
                <th className="text-left p-3">Días</th>
                <th className="text-left p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id} className="border-t hover:bg-muted/50">
                  <td className="p-3">{row.email}</td>
                  <td className="p-3">{row.nombre || ""} {row.apellidos || ""}</td>
                  <td className="p-3">{new Date(row.fechaRegistro).toLocaleDateString("es-ES")}</td>
                  <td className="p-3">{Math.floor((Date.now() - new Date(row.fechaRegistro).getTime()) / (1000 * 60 * 60 * 24))}</td>
                  <td className="p-3">
                    <Button size="sm" variant="outline" asChild>
                      <a href={`mailto:${row.email}`}>Email</a>
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
