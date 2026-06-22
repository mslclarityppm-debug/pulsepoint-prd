import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, userProfiles, healthMetrics, contents, questionnaires, consultations, consultationMessages } from "@/db/schema";
import { count, eq } from "drizzle-orm";

dotenv.config({ path: ".env" });

const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin123";
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD || "paciente123";
const SEED_TEST_PASSWORD = process.env.SEED_TEST_PASSWORD || "test123";

async function upsertUser(email: string, password: string, role: "user" | "admin", perfil: { nombre: string; apellidos: string }) {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0 && existing[0]) return existing[0].id;

  const hash = bcrypt.hashSync(password, 10);
  const [user] = await db.insert(users).values({ email, passwordHash: hash, role }).returning({ id: users.id });
  if (!user) throw new Error("No se pudo crear el usuario");
  const userId = user.id;
  await db.insert(userProfiles).values({
    userId,
    nombre: perfil.nombre,
    apellidos: perfil.apellidos,
    consentimientoGdpr: true,
    consentimientoSalud: true,
  });
  return userId;
}

async function main() {
  console.log("=== Seed de base de datos Turso ===\n");

  const adminId = await upsertUser("admin@los8.es", SEED_ADMIN_PASSWORD, "admin", { nombre: "Ana", apellidos: "Gestora" });
  const userId = await upsertUser("paciente@los8.es", SEED_USER_PASSWORD, "user", { nombre: "Carlos", apellidos: "Martínez" });
  await upsertUser("john@doe.com", SEED_TEST_PASSWORD, "admin", { nombre: "John", apellidos: "Doe" });

  console.log("Usuarios sembrados (admin / paciente / test)");

  const countMetrics = await db.select({ c: count() }).from(healthMetrics).where(eq(healthMetrics.userId, userId)).then(r => r[0]?.c || 0);
  if (countMetrics === 0) {
    const hoy = new Date();
    const daysAgo = (n: number) => {
      const d = new Date(hoy);
      d.setDate(d.getDate() - n);
      return d.toISOString().slice(0, 10);
    };

    await db.insert(healthMetrics).values([
      { userId, tipo: "peso", valorPeso: 55000, fecha: daysAgo(28), notas: "Bajo peso" },
      { userId, tipo: "peso", valorPeso: 72000, fecha: daysAgo(21), notas: "Peso normal inferior" },
      { userId, tipo: "peso", valorPeso: 85000, fecha: daysAgo(14), notas: "Sobrepeso ligero" },
      { userId, tipo: "peso", valorPeso: 105000, fecha: daysAgo(7), notas: "Obesidad grado 1" },
      { userId, tipo: "peso", valorPeso: 75000, fecha: daysAgo(0), notas: "Mejorando hábitos" },
      { userId, tipo: "tension", sistolica: 138, diastolica: 88, frecuenciaCardiaca: 72, fecha: daysAgo(21), notas: null },
      { userId, tipo: "tension", sistolica: 135, diastolica: 85, frecuenciaCardiaca: 70, fecha: daysAgo(14), notas: null },
      { userId, tipo: "tension", sistolica: 132, diastolica: 84, frecuenciaCardiaca: 68, fecha: daysAgo(7), notas: null },
      { userId, tipo: "tension", sistolica: 128, diastolica: 82, frecuenciaCardiaca: 66, fecha: daysAgo(1), notas: "Tras caminar" },
    ]);
    console.log("Métricas sembradas");
  }

  const countContents = await db.select({ c: count() }).from(contents).then(r => r[0]?.c || 0);
  if (countContents === 0) {
    await db.insert(contents).values([
      { tipo: "video", titulo: "¿Por qué importa la tensión arterial?", descripcion: "Breve explicación sobre el impacto cardiovascular de la hipertensión.", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", categoria: "tension", orden: 1, activo: true },
      { tipo: "infografia", titulo: "Guía visual: dieta cardiosaludable", descripcion: "Resumen visual de la dieta mediterránea y sus beneficios.", url: "https://www.who.int/es/news-room/fact-sheets/detail/healthy-diet", categoria: "dieta", orden: 2, activo: true },
      { tipo: "articulo", titulo: "Actividad física: 150 minutos a la semana", descripcion: "Cómo encajar la actividad física moderada en tu rutina diaria.", url: "https://www.who.int/es/news-room/fact-sheets/detail/physical-activity", categoria: "actividad_fisica", orden: 3, activo: true },
      { tipo: "video", titulo: "El sueño y el corazón", descripcion: "Dormir 7–9h reduce el riesgo cardiovascular.", url: "https://www.youtube.com/watch?v=oc6vCgFmsrY", categoria: "sueno", orden: 4, activo: true },
      { tipo: "articulo", titulo: "Dejar de fumar: beneficios a los 20 minutos", descripcion: "Cronología de los beneficios tras abandonar el tabaco.", url: "https://www.who.int/es/news-room/fact-sheets/detail/tobacco", categoria: "tabaco", orden: 5, activo: true },
      { tipo: "infografia", titulo: "Colesterol: bueno, malo y total", descripcion: "Entiende tus analíticas en un vistazo.", url: "https://medlineplus.gov/spanish/cholesterol.html", categoria: "colesterol", orden: 6, activo: true },
    ]);
    console.log("Contenidos sembrados");
  }

  const countQuest = await db.select({ c: count() }).from(questionnaires).then(r => r[0]?.c || 0);
  if (countQuest === 0) {
    const preguntas = [
      { id: 1, texto: "¿Cuántas raciones de fruta/verdura consumiste ayer?", opciones: [{ texto: "Menos de 2", puntos: 0 }, { texto: "Entre 2 y 4", puntos: 1 }, { texto: "5 o más", puntos: 2 }] },
      { id: 2, texto: "¿Hiciste al menos 30 min de actividad física ayer?", opciones: [{ texto: "No", puntos: 0 }, { texto: "Ligera", puntos: 1 }, { texto: "Moderada o intensa", puntos: 2 }] },
      { id: 3, texto: "¿Fumaste o vapeaste en las últimas 24 horas?", opciones: [{ texto: "Sí, varias veces", puntos: 0 }, { texto: "Sí, poco", puntos: 1 }, { texto: "No", puntos: 2 }] },
      { id: 4, texto: "¿Cómo describirías la calidad de tu sueño anoche?", opciones: [{ texto: "Mala", puntos: 0 }, { texto: "Regular", puntos: 1 }, { texto: "Buena", puntos: 2 }] },
      { id: 5, texto: "¿Has registrado hoy tu tensión arterial?", opciones: [{ texto: "No", puntos: 0 }, { texto: "Sí", puntos: 2 }] },
    ];
    await db.insert(questionnaires).values({
      titulo: "Seguimiento quincenal",
      descripcion: "Cuestionario breve para evaluar tu adherencia a hábitos saludables.",
      preguntasJson: JSON.stringify(preguntas),
      activo: true,
    });
    console.log("Cuestionario sembrado");
  }

  const countCons = await db.select({ c: count() }).from(consultations).where(eq(consultations.userId, userId)).then(r => r[0]?.c || 0);
  if (countCons === 0) {
    const [consulta] = await db.insert(consultations).values({
      userId,
      asunto: "Dudas sobre mi tensión",
      mensajeInicial: "Hola, mi tensión suele estar entre 135/85 y 140/90. ¿Es motivo de preocupación?",
      estado: "en_proceso",
    }).returning({ id: consultations.id });
    if (!consulta) throw new Error("No se pudo crear la consulta");
    const consultationId = consulta.id;
    await db.insert(consultationMessages).values([
      { consultationId, userId, mensaje: "Hola, mi tensión suele estar entre 135/85 y 140/90. ¿Es motivo de preocupación?", esAdmin: false },
      { consultationId, userId: adminId, mensaje: "Hola Carlos, esos valores son ligeramente elevados (normal-alta). Te recomendamos mantener el registro diario y revisar ingesta de sal. Si supera 140/90 de forma sostenida, consulta con tu médico.", esAdmin: true },
    ]);
    console.log("Consulta de ejemplo sembrada");
  }

  console.log("\nSeed completado en Turso");
  console.log("Cuentas disponibles:");
  console.log(` • Admin: admin@los8.es / ${SEED_ADMIN_PASSWORD}`);
  console.log(` • Paciente: paciente@los8.es / ${SEED_USER_PASSWORD}`);
  console.log(` • Test: john@doe.com / ${SEED_TEST_PASSWORD}`);
}

main().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
