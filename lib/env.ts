// Validación y tipado de variables de entorno con @t3-oss/env-nextjs y Zod.
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SESSION_SECRET: z
      .string()
      .min(32, "SESSION_SECRET debe tener al menos 32 caracteres en producción"),
    SESSION_MAX_AGE_DAYS: z.coerce.number().int().positive().default(7),
    EMAIL_SMTP_HOST: z.string().optional(),
    EMAIL_SMTP_PORT: z.coerce.number().int().positive().default(587),
    EMAIL_SMTP_USER: z.string().optional(),
    EMAIL_SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().email().optional(),
    ALLOWED_ORIGIN: z.string().optional(),
    APP_URL: z.string().url().optional(),
    ALLOWED_REGISTER_DOMAINS: z.string().optional(),
    SKIP_ENV_VALIDATION: z.string().optional(),
    ENABLE_DAILY_REPORTS: z.string().optional(),
    REPORT_RECIPIENTS: z.string().optional(),
    DATA_ENCRYPTION_KEY: z.string().optional(),
  },
  client: {},
  runtimeEnv: {
    SESSION_SECRET: process.env.SESSION_SECRET,
    SESSION_MAX_AGE_DAYS: process.env.SESSION_MAX_AGE_DAYS,
    EMAIL_SMTP_HOST: process.env.EMAIL_SMTP_HOST,
    EMAIL_SMTP_PORT: process.env.EMAIL_SMTP_PORT,
    EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER,
    EMAIL_SMTP_PASS: process.env.EMAIL_SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN,
    APP_URL: process.env.APP_URL,
    ALLOWED_REGISTER_DOMAINS: process.env.ALLOWED_REGISTER_DOMAINS,
    SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
    ENABLE_DAILY_REPORTS: process.env.ENABLE_DAILY_REPORTS,
    REPORT_RECIPIENTS: process.env.REPORT_RECIPIENTS,
    DATA_ENCRYPTION_KEY: process.env.DATA_ENCRYPTION_KEY,
  },
  emptyStringAsUndefined: true,
  // En scripts (seed) no queremos fallo por SESSION_SECRET ausente.
  // Solo permitir skip si se ejecuta fuera del request cycle (scripts directos).
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true" && typeof window === "undefined" && !process.env.NEXT_RUNTIME,
});
