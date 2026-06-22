import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { users, userProfiles, questionnaireResponses } from "@/db/schema";
import { eq, desc, isNull, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 100;

    const data = await db
      .select({
        id: users.id,
        email: users.email,
        nombre: userProfiles.nombre,
        apellidos: userProfiles.apellidos,
        fechaRegistro: users.createdAt,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
       .leftJoin(questionnaireResponses, eq(questionnaireResponses.userId, users.id))
       .where(and(eq(users.role, 'user'), isNull(questionnaireResponses.id)))
       .orderBy(desc(users.createdAt))
      .limit(limit);

    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    console.error("[GET /api/reportes/cuestionarios]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
