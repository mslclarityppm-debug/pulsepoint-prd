// Listado de respuestas a cuestionarios para el admin.
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  questionnaireResponses as qrTable,
  questionnaires,
  users,
  userProfiles,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatearFecha } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function RespuestasCuestionariosPage() {
  await requireAdmin();

  const respuestas = await db
    .select({
      id: qrTable.id,
      usuarioId: qrTable.userId,
      cuestionarioId: qrTable.questionnaireId,
      puntuacion: qrTable.puntuacion,
      fecha: qrTable.fecha,
      email: users.email,
      nombre: userProfiles.nombre,
      apellidos: userProfiles.apellidos,
      tituloCuestionario: questionnaires.titulo,
    })
    .from(qrTable)
    .leftJoin(users, eq(users.id, qrTable.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(questionnaires, eq(questionnaires.id, qrTable.questionnaireId))
    .orderBy(desc(qrTable.fecha));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          Respuestas a cuestionarios
        </h1>
        <p className="text-muted-foreground mt-1">
          Historial de respuestas de los usuarios a los cuestionarios.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-2 pr-3">Usuario</th>
              <th className="py-2 pr-3">Cuestionario</th>
              <th className="py-2 pr-3">Puntuación</th>
              <th className="py-2 pr-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {(respuestas ?? []).map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2 pr-3">
                  {r.nombre ? `${r.nombre} ${r.apellidos ?? ""}` : r.email}
                </td>
                <td className="py-2 pr-3">{r.tituloCuestionario || "—"}</td>
                <td className="py-2 pr-3 font-semibold">{r.puntuacion}</td>
                <td className="py-2 pr-3 text-muted-foreground">
                  {formatearFecha(r.fecha)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
