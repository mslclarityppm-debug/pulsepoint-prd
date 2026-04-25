// Carga de datos de ejemplo (seed) para "Pulse_point".
// Idempotente: comprueba existencia antes de insertar.
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";
import fs from "node:fs";

const dbPath = path.join(process.cwd(), "data", "los8.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

function upsertUser(
  email: string,
  password: string,
  role: "user" | "admin",
  perfil: { nombre: string; apellidos: string },
): number {
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email) as { id: number } | undefined;
  if (existing) return existing.id;
  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
    )
    .run(email, hash, role);
  const userId = Number(info.lastInsertRowid);
  db.prepare(
    `INSERT INTO user_profiles
     (user_id, nombre, apellidos, consentimiento_gdpr, consentimiento_salud)
     VALUES (?, ?, ?, 1, 1)`,
  ).run(userId, perfil.nombre, perfil.apellidos);
  return userId;
}

// --- Usuarios ---
const adminId = upsertUser("admin@los8.es", "admin12345", "admin", {
  nombre: "Ana",
  apellidos: "Gestora",
});
const userId = upsertUser("paciente@los8.es", "paciente123", "user", {
  nombre: "Carlos",
  apellidos: "Martínez",
});
// Cuenta de test por defecto
upsertUser("john@doe.com", "johndoe123", "admin", {
  nombre: "John",
  apellidos: "Doe",
});

console.log("✓ Usuarios sembrados (admin / paciente)");

// --- Métricas de ejemplo ---
const countMetrics = (
  db.prepare("SELECT COUNT(*) as c FROM health_metrics WHERE user_id = ?").get(
    userId,
  ) as { c: number }
).c;
if (countMetrics === 0) {
  const hoy = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };
  const insertPeso = db.prepare(
    "INSERT INTO health_metrics (user_id, tipo, valor_peso, fecha, notas) VALUES (?, 'peso', ?, ?, ?)",
  );
  const insertTension = db.prepare(
    "INSERT INTO health_metrics (user_id, tipo, sistolica, diastolica, frecuencia_cardiaca, fecha, notas) VALUES (?, 'tension', ?, ?, ?, ?, ?)",
  );
  // Pesos (en gramos)
  insertPeso.run(userId, 82000, daysAgo(28), "Inicio seguimiento");
  insertPeso.run(userId, 81500, daysAgo(21), null);
  insertPeso.run(userId, 81200, daysAgo(14), null);
  insertPeso.run(userId, 80800, daysAgo(7), null);
  insertPeso.run(userId, 80300, daysAgo(0), "Mejorando hábitos");
  // Tensiones
  insertTension.run(userId, 138, 88, 72, daysAgo(21), null);
  insertTension.run(userId, 135, 85, 70, daysAgo(14), null);
  insertTension.run(userId, 132, 84, 68, daysAgo(7), null);
  insertTension.run(userId, 128, 82, 66, daysAgo(1), "Tras caminar");
  console.log("✓ Métricas sembradas");
}

// --- Contenidos educativos ---
const countContents = (
  db.prepare("SELECT COUNT(*) as c FROM contents").get() as { c: number }
).c;
if (countContents === 0) {
  const ins = db.prepare(
    "INSERT INTO contents (tipo, titulo, descripcion, url, categoria, orden, activo) VALUES (?, ?, ?, ?, ?, ?, 1)",
  );
  const contenidos = [
    [
      "video",
      "¿Por qué importa la tensión arterial?",
      "Breve explicación sobre el impacto cardiovascular de la hipertensión.",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "tension",
      1,
    ],
    [
      "infografia",
      "Guía visual: dieta cardiosaludable",
      "Resumen visual de la dieta mediterránea y sus beneficios.",
      "https://www.who.int/es/news-room/fact-sheets/detail/healthy-diet",
      "dieta",
      2,
    ],
    [
      "articulo",
      "Actividad física: 150 minutos a la semana",
      "Cómo encajar la actividad física moderada en tu rutina diaria.",
      "https://www.who.int/es/news-room/fact-sheets/detail/physical-activity",
      "actividad_fisica",
      3,
    ],
    [
      "video",
      "El sueño y el corazón",
      "Dormir 7–9h reduce el riesgo cardiovascular.",
      "https://www.youtube.com/watch?v=oc6vCgFmsrY",
      "sueno",
      4,
    ],
    [
      "articulo",
      "Dejar de fumar: beneficios a los 20 minutos",
      "Cronología de los beneficios tras abandonar el tabaco.",
      "https://www.who.int/es/news-room/fact-sheets/detail/tobacco",
      "tabaco",
      5,
    ],
    [
      "infografia",
      "Colesterol: bueno, malo y total",
      "Entiende tus analíticas en un vistazo.",
      "https://medlineplus.gov/spanish/cholesterol.html",
      "colesterol",
      6,
    ],
  ];
  for (const c of contenidos) ins.run(...c);
  console.log("✓ Contenidos sembrados");
}

// --- Cuestionario de ejemplo ---
const countQuest = (
  db.prepare("SELECT COUNT(*) as c FROM questionnaires").get() as { c: number }
).c;
if (countQuest === 0) {
  const preguntas = [
    {
      id: 1,
      texto: "¿Cuántas raciones de fruta/verdura consumiste ayer?",
      opciones: [
        { texto: "Menos de 2", puntos: 0 },
        { texto: "Entre 2 y 4", puntos: 1 },
        { texto: "5 o más", puntos: 2 },
      ],
    },
    {
      id: 2,
      texto: "¿Hiciste al menos 30 min de actividad física ayer?",
      opciones: [
        { texto: "No", puntos: 0 },
        { texto: "Ligera", puntos: 1 },
        { texto: "Moderada o intensa", puntos: 2 },
      ],
    },
    {
      id: 3,
      texto: "¿Fumaste o vapeaste en las últimas 24 horas?",
      opciones: [
        { texto: "Sí, varias veces", puntos: 0 },
        { texto: "Sí, poco", puntos: 1 },
        { texto: "No", puntos: 2 },
      ],
    },
    {
      id: 4,
      texto: "¿Cómo describirías la calidad de tu sueño anoche?",
      opciones: [
        { texto: "Mala", puntos: 0 },
        { texto: "Regular", puntos: 1 },
        { texto: "Buena", puntos: 2 },
      ],
    },
    {
      id: 5,
      texto: "¿Has registrado hoy tu tensión arterial?",
      opciones: [
        { texto: "No", puntos: 0 },
        { texto: "Sí", puntos: 2 },
      ],
    },
  ];
  db.prepare(
    "INSERT INTO questionnaires (titulo, descripcion, preguntas_json, activo) VALUES (?, ?, ?, 1)",
  ).run(
    "Seguimiento quincenal",
    "Cuestionario breve para evaluar tu adherencia a hábitos saludables.",
    JSON.stringify(preguntas),
  );
  console.log("✓ Cuestionario sembrado");
}

// --- Consulta de ejemplo ---
const countCons = (
  db.prepare("SELECT COUNT(*) as c FROM consultations WHERE user_id = ?").get(
    userId,
  ) as { c: number }
).c;
if (countCons === 0) {
  const info = db
    .prepare(
      "INSERT INTO consultations (user_id, asunto, mensaje_inicial, estado) VALUES (?, ?, ?, 'en_proceso')",
    )
    .run(
      userId,
      "Dudas sobre mi tensión",
      "Hola, mi tensión suele estar entre 135/85 y 140/90. ¿Es motivo de preocupación?",
    );
  const consultationId = Number(info.lastInsertRowid);
  db.prepare(
    "INSERT INTO consultation_messages (consultation_id, user_id, mensaje, es_admin) VALUES (?, ?, ?, ?)",
  ).run(
    consultationId,
    userId,
    "Hola, mi tensión suele estar entre 135/85 y 140/90. ¿Es motivo de preocupación?",
    0,
  );
  db.prepare(
    "INSERT INTO consultation_messages (consultation_id, user_id, mensaje, es_admin) VALUES (?, ?, ?, ?)",
  ).run(
    consultationId,
    adminId,
    "Hola Carlos, esos valores son ligeramente elevados (normal-alta). Te recomendamos mantener el registro diario y revisar ingesta de sal. Si supera 140/90 de forma sostenida, consulta con tu médico.",
    1,
  );
  console.log("✓ Consulta de ejemplo sembrada");
}

console.log("\n✨ Seed completado.\n");
console.log("Cuentas disponibles:");
console.log("  • Admin:    admin@los8.es    / admin12345");
console.log("  • Paciente: paciente@los8.es / paciente123");
db.close();
