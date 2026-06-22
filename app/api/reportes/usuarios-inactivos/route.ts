// GET /api/reportes/usuarios-inactivos
// Query params: ?segmento=0-7d&page=1&limit=100
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { users, userProfiles, healthMetrics } from "@/db/schema";
import { eq, sql, desc, isNull, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 100;

    const data = await db
      .select({
        id: users.id,
        email: users.email,
        fechaRegistro: users.createdAt,
        nombre: userProfiles.nombre,
        apellidos: userProfiles.apellidos,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
       .leftJoin(healthMetrics, eq(healthMetrics.userId, users.id))
       .where(and(eq(users.role, 'user'), isNull(healthMetrics.id)))
       .orderBy(desc(users.createdAt))
      .limit(limit);

    // Calculate totals
    const totalUsuarios = await db.$count(users, eq(users.role, 'user'));
    const conMetricasResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT user_id)` })
      .from(healthMetrics);
    const conMetricas = conMetricasResult[0]?.count ?? 0;
    const sinMetricas = totalUsuarios - conMetricas;
    const porcentajeSinMetricas = totalUsuarios > 0 ? Math.round((sinMetricas * 100.0) / totalUsuarios * 10) / 10 : 0;

    return NextResponse.json({
      data,
      total: sinMetricas,
      page,
      limit,
      totalConMetricas: conMetricas,
      totalSinMetricas: sinMetricas,
      porcentajeSinMetricas
    });
  } catch (error) {
    console.error("[GET /api/reportes/usuarios-inactivos]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
