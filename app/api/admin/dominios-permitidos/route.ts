import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { allowedRegisterDomains } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const dominios = await db
      .select()
      .from(allowedRegisterDomains)
      .orderBy(desc(allowedRegisterDomains.createdAt));

    return NextResponse.json({ dominios });
  } catch (err) {
    console.error("Error al obtener dominios:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { domain, active = true } = body;

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Dominio requerido" }, { status: 400 });
    }

    const dominioNormalizado = domain.trim().toLowerCase();
    if (!dominioNormalizado.startsWith("@")) {
      return NextResponse.json({ error: "El dominio debe empezar con @" }, { status: 400 });
    }

    const [nuevo] = await db
      .insert(allowedRegisterDomains)
      .values({ domain: dominioNormalizado, active })
      .returning();

    return NextResponse.json({ dominio: nuevo }, { status: 201 });
  } catch (err) {
    console.error("Error al crear dominio:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
