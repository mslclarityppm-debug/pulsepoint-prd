"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Heart } from "lucide-react";
import type { ReporteSaludResponse } from "@/actions/reportes";

interface ReporteSaludProps {
  initialData: ReporteSaludResponse;
}

export function ReporteSalud({ initialData }: ReporteSaludProps) {
  const [data, setData] = useState(initialData);
  const [periodo, setPeriodo] = useState(
    initialData?.periodo === 7 ? "7d" : initialData?.periodo === 30 ? "30d" : initialData?.periodo === 90 ? "90d" : "all"
  );

  const cargarDatos = async (nuevoPeriodo: string) => {
    const res = await fetch(`/api/reportes/salud?periodo=${nuevoPeriodo}`, { cache: "no-store" });
    const nuevosDatos = await res.json();
    setData(nuevosDatos);
    setPeriodo(nuevoPeriodo);
  };

  const peso = data?.peso || [];
  const tension = data?.tension || [];

  if (!initialData || !Array.isArray(peso) || !Array.isArray(tension)) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribución de métricas de salud</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Error al cargar los datos del reporte.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Distribución de métricas de salud</CardTitle>
            <div className="flex gap-1">
              {[
                { value: "7d", label: "7d" },
                { value: "30d", label: "30d" },
                { value: "90d", label: "90d" },
                { value: "all", label: "All" },
              ].map(({ value, label }) => (
                <Button
                  key={value}
                  size="sm"
                  variant={periodo === value ? "default" : "outline"}
                  onClick={() => cargarDatos(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Peso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Distribución por peso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Rango</th>
                    <th className="text-right p-3">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {peso.map((p, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="p-3">{p.rango}</td>
                      <td className="p-3 text-right">{p.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Tensión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Clasificación tensión arterial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Clasificación</th>
                    <th className="text-right p-3">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {tension.map((t, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="p-3">{t.clasificacion}</td>
                      <td className="p-3 text-right">{t.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}