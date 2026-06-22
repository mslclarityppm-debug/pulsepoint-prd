// Cliente Drizzle singleton con Turso/libsql (serverless).
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { users, userProfiles, healthMetrics, contents, questionnaires, questionnaireResponses, consultations, consultationMessages, achievements, streaks, auditLogs, revokedSessions, passwordResetTokens, passwordHistory } from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(client, {
  schema: {
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
  },
}) as LibSQLDatabase<{
  users: typeof users;
  userProfiles: typeof userProfiles;
  healthMetrics: typeof healthMetrics;
  contents: typeof contents;
  questionnaires: typeof questionnaires;
  questionnaireResponses: typeof questionnaireResponses;
  consultations: typeof consultations;
  consultationMessages: typeof consultationMessages;
  achievements: typeof achievements;
  streaks: typeof streaks;
  auditLogs: typeof auditLogs;
  revokedSessions: typeof revokedSessions;
  passwordResetTokens: typeof passwordResetTokens;
  passwordHistory: typeof passwordHistory;
}>;

export { users, userProfiles, healthMetrics, contents, questionnaires, questionnaireResponses, consultations, consultationMessages, achievements, streaks, auditLogs, revokedSessions, passwordResetTokens, passwordHistory };
