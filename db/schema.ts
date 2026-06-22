// Esquema Drizzle ORM para "Pulse_point" (SQLite).
// Todas las tablas y campos del MVP: usuarios, perfiles, métricas, contenidos,
// cuestionarios, respuestas, consultas y mensajes.
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// --- Usuarios ---
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // 'user' | 'admin'
  // CHECK constraint no se usa en Drizzle SQLite; se valida a nivel aplicación
  role: text("role").notNull().default("user"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Tokens de reseteo de contraseña ---
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Perfiles de usuario (1:1 con users) ---
export const userProfiles = sqliteTable("user_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  nombre: text("nombre").notNull(),
  apellidos: text("apellidos").notNull().default(""),
  fechaNacimiento: text("fecha_nacimiento"), // ISO yyyy-mm-dd
  sexo: text("sexo"), // 'hombre' | 'mujer' | 'otro' | null
  telefono: text("telefono"),
  consentimientoGdpr: integer("consentimiento_gdpr", { mode: "boolean" })
    .notNull()
    .default(false),
  consentimientoSalud: integer("consentimiento_salud", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Métricas de salud ---
// tipo: 'peso' | 'tension'
// Para peso se usa valorPeso; para tensión se usan sistolica/diastolica/frecuenciaCardiaca.
export const healthMetrics = sqliteTable("health_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(), // 'peso' | 'tension'
  valorPeso: integer("valor_peso"), // en gramos para precisión (ej. 75500 = 75.5 kg)
  sistolica: integer("sistolica"),
  diastolica: integer("diastolica"),
  frecuenciaCardiaca: integer("frecuencia_cardiaca"),
  fecha: text("fecha").notNull(), // ISO yyyy-mm-dd
  notas: text("notas"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Biblioteca de contenidos educativos ---
export const contents = sqliteTable("contents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tipo: text("tipo").notNull(), // 'video' | 'infografia' | 'articulo'
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion").notNull().default(""),
  url: text("url").notNull(),
  categoria: text("categoria"), // uno de los 8 esenciales (sueño, tensión, etc.)
  orden: integer("orden").notNull().default(0),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Cuestionarios ---
// preguntasJson: JSON con estructura [{ id, texto, opciones: [{texto, puntos}] }]
export const questionnaires = sqliteTable("questionnaires", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion").notNull().default(""),
  preguntasJson: text("preguntas_json").notNull(), // JSON serializado
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Respuestas a cuestionarios ---
export const questionnaireResponses = sqliteTable("questionnaire_responses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questionnaireId: integer("questionnaire_id")
    .notNull()
    .references(() => questionnaires.id, { onDelete: "cascade" }),
  respuestasJson: text("respuestas_json").notNull(), // JSON con índices seleccionados
  puntuacion: integer("puntuacion").notNull().default(0),
  fecha: text("fecha")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Consultas (hilos/tickets) ---
export const consultations = sqliteTable("consultations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  asunto: text("asunto").notNull(),
  mensajeInicial: text("mensaje_inicial").notNull(),
  estado: text("estado").notNull().default("abierta"), // 'abierta' | 'en_proceso' | 'cerrada'
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Mensajes de consulta ---
export const consultationMessages = sqliteTable("consultation_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  consultationId: integer("consultation_id")
    .notNull()
    .references(() => consultations.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mensaje: text("mensaje").notNull(),
  esAdmin: integer("es_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Logros / Badges ---
export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  badgeId: text("badge_id").notNull(), // constancia_7, completitud, etc.
  unlockedAt: text("unlocked_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  metadata: text("metadata", { mode: "json" }), // contexto como JSON
});

// --- Streaks (días con actividad) ---
export const streaks = sqliteTable("streaks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // yyyy-mm-dd
  hasMedicalMetric: integer("has_medical_metric", { mode: "boolean" }).notNull().default(false),
  hasDietLog: integer("has_diet_log", { mode: "boolean" }).notNull().default(false),
  hasQuestionnaire: integer("has_questionnaire", { mode: "boolean" }).notNull().default(false),
});

// --- Audit Logs (for PHI access tracking) ---
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: integer("resource_id"),
  metadata: text("metadata"),
  ipAddress: text("ip_address"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Session Revocation (for secure logout) ---
export const revokedSessions = sqliteTable("revoked_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenId: text("token_id").notNull(),
  revokedAt: text("revoked_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Password History (prevent password reuse) ---
export const passwordHistory = sqliteTable("password_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Tipos derivados ---

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type HealthMetric = typeof healthMetrics.$inferSelect;
export type Content = typeof contents.$inferSelect;
export type Questionnaire = typeof questionnaires.$inferSelect;
export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
export type Consultation = typeof consultations.$inferSelect;
export type ConsultationMessage = typeof consultationMessages.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type Streak = typeof streaks.$inferSelect;
export type NewStreak = typeof streaks.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type RevokedSession = typeof revokedSessions.$inferSelect;
export type NewRevokedSession = typeof revokedSessions.$inferInsert;
export type PasswordHistoryEntry = typeof passwordHistory.$inferSelect;
export type NewPasswordHistoryEntry = typeof passwordHistory.$inferInsert;
