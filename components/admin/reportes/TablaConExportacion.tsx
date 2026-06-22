"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface TablaConExportacionProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  fileName: string;
}

export function TablaConExportacion<T>({
  data,
  columns,
  fileName,
}: TablaConExportacionProps<T>) {
  // ——— Export CSV ———
  const exportarCSV = () => {
    try {
      const cabeceras = columns.map((c) => c.label);
      const filas = data.map((row) =>
        columns.map((c) => {
          const valor = c.render ? c.render(row) : (row as any)[c.key];
          // Convertir ReactNode a texto plano
          const texto = typeof valor === "string" ? valor : String(valor);
          // Escapar comas y comillas
          return `"${texto.replace(/"/g, '""')}"`;
        }).join(",")
      );

      const csvContent = "\uFEFF" + [cabeceras.join(","), ...filas].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
    }
  };

  // ——— Export PDF (window.print) ———
  const exportarPDF = () => {
    window.print();
  };

  return (
    <div>
      {/* Barra de herramientas */}
      <div className="flex justify-end items-center mb-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportarCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportarPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Tabla simple */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="text-left p-3 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted-foreground py-8">
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={(row as any).id ?? i} className="border-t hover:bg-muted/50">
                  {columns.map((col) => (
                    <td key={col.key} className="p-3 whitespace-nowrap">
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
