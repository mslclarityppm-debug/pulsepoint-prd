"use client";
// Gráfico de líneas para evolución de métricas.
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

type Punto = {
  fecha: string;
  peso?: number | null;
  sistolica?: number | null;
  diastolica?: number | null;
};

export function GraficoEvolucion({
  datos,
  tipo,
}: {
  datos: Punto[];
  tipo: "peso" | "tension";
}) {
  if (!datos?.length) {
    return (
      <div className="h-64 grid place-items-center text-sm text-muted-foreground">
        Sin datos para mostrar
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={datos}
          margin={{ top: 12, right: 16, left: 0, bottom: 24 }}
        >
          <XAxis
            dataKey="fecha"
            tick={{ fontSize: 10 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 6 }}
            labelStyle={{ fontSize: 11 }}
          />
          <Legend
            verticalAlign="top"
            height={28}
            wrapperStyle={{ fontSize: 11 }}
          />
          {tipo === "peso" ? (
            <Line
              type="monotone"
              dataKey="peso"
              name="Peso (kg)"
              stroke="#0e8a9a"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="sistolica"
                name="Sistólica"
                stroke="#d9534f"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="diastolica"
                name="Diastólica"
                stroke="#0e8a9a"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
