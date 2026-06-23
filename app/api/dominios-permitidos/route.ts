import { NextResponse } from "next/server";
import { db } from "@/db";
import { allowedRegisterDomains } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const dominios = await db
      .select({ domain: allowedRegisterDomains.domain })
      .from(allowedRegisterDomains)
      .where(eq(allowedRegisterDomains.active, true))
      .orderBy(allowedRegisterDomains.domain);

    return NextResponse.json({ dominios });
  } catch (err) {
    console.error("Error al obtener dominios públicos:", err);
    return NextResponse.json({ dominios: [] });
  }
}
