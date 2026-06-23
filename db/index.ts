// Cliente Drizzle singleton: SQLite local en desarrollo, Turso en producción.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env" });
}

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzleSQLite } from "drizzle-orm/better-sqlite3";
import { createClient } from "@libsql/client";

import { users, userProfiles, healthMetrics, contents, questionnaires, questionnaireResponses, consultations, consultationMessages, achievements, streaks, auditLogs, revokedSessions, passwordResetTokens, passwordHistory, allowedRegisterDomains } from "./schema";

const schema = {
  users,
  userProfiles,
  healthMetrics,
  contents,
  questionnaires,
  questionnaireResponses,
  consultations,
  consultationMessages,
  achievements,
  streaks,
  auditLogs,
  revokedSessions,
  passwordResetTokens,
  passwordHistory,
  allowedRegisterDomains,
};

const useTurso = process.env.NODE_ENV === "production" && !!process.env.TURSO_DATABASE_URL;

// @ts-ignore - Tipado dinámico según driver (SQLite/LibSQL)
const db = useTurso
  ? drizzleLibsql(
      createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      }),
      { schema }
    )
  : (() => {
      const dbPath = path.join(process.cwd(), "data", "los8.db");
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      const sqlite = new Database(dbPath);
      sqlite.pragma("journal_mode = WAL");
      sqlite.pragma("foreign_keys = ON");
      return drizzleSQLite(sqlite, { schema });
    })();

export { db };
export { users, userProfiles, healthMetrics, contents, questionnaires, questionnaireResponses, consultations, consultationMessages, achievements, streaks, auditLogs, revokedSessions, passwordResetTokens, passwordHistory, allowedRegisterDomains };
