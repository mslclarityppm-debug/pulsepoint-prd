import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

dotenv.config({ path: ".env" });

const usuarios = [
  {
    email: "cevelez@proeconsulting.com",
    password: "]9&PzBVqACWq/.%EmQ[9",
    role: "admin" as const,
    perfil: { nombre: "Carlos", apellidos: "Evelez" },
  },
  {
    email: "moriarty@morningview.top",
    password: "A1b2c3d4e5.20xx",
    role: "admin" as const,
    perfil: { nombre: "Moriarty", apellidos: "Admin" },
  },
  {
    email: "Jefelili@gmail.com",
    password: "iK62_a3Hp=FB#}at.*,x",
    role: "user" as const,
    perfil: { nombre: "Jefelili", apellidos: "User" },
  },
  {
    email: "tatiana.mejiav@unilibre.edu.co",
    password: ";*W@J(x=ZP]~uq)ic9C8",
    role: "user" as const,
    perfil: { nombre: "Tatiana", apellidos: "Mejía" },
  },
];

async function main() {
  console.log("=== Importando usuarios a Turso ===\n");

  for (const u of usuarios) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, u.email)).limit(1);
    if (existing.length > 0) {
      console.log(`[SKIP] ${u.email} ya existe`);
      continue;
    }

    const hash = bcrypt.hashSync(u.password, 10);
    const [user] = await db.insert(users).values({ email: u.email, passwordHash: hash, role: u.role }).returning({ id: users.id });
    if (!user) throw new Error(`No se pudo crear ${u.email}`);

    await db.insert(userProfiles).values({
      userId: user.id,
      nombre: u.perfil.nombre,
      apellidos: u.perfil.apellidos,
      consentimientoGdpr: true,
      consentimientoSalud: true,
    });

    console.log(`[OK] ${u.email} (${u.role})`);
  }

  console.log("\nImportación completada");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
