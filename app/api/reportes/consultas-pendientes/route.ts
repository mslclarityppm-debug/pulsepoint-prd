import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { consultations, users, userProfiles } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 100;

    const data = await db
      .select({
        id: consultations.id,
        asunto: consultations.asunto,
        fechaCreacion: consultations.createdAt,
        estado: consultations.estado,
        usuarioEmail: users.email,
        usuarioNombre: userProfiles.nombre,
        totalMensajes: sql<number>`(SELECT COUNT(*) FROM consultation_messages WHERE consultationId = consultations.id)`,
        horasAbierta: sql<number>`ROUND((JULIANDAY('now') - JULIANDAY(consultations.createdAt)) * 24, 1)`,
      })
      .from(consultations)
      .innerJoin(users, eq(users.id, consultations.userId))
       .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
       .where(inArray(consultations.estado, ['abierta', 'en_proceso']))
       .orderBy(consultations.createdAt)
      .limit(limit);

    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    console.error("[GET /api/reportes/consultas-pendientes]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
