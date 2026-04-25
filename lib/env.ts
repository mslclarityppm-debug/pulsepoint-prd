// Validación y tipado de variables de entorno con @t3-oss/env-nextjs y Zod.
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SESSION_SECRET: z
      .string()
      .min(16, "SESSION_SECRET debe tener al menos 16 caracteres"),
    EMAIL_SMTP_HOST: z.string().optional(),
    EMAIL_SMTP_PORT: z.coerce.number().int().positive().default(587),
    EMAIL_SMTP_USER: z.string().optional(),
    EMAIL_SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().email().optional(),
  },
  client: {},
  runtimeEnv: {
    SESSION_SECRET: process.env.SESSION_SECRET,
    EMAIL_SMTP_HOST: process.env.EMAIL_SMTP_HOST,
    EMAIL_SMTP_PORT: process.env.EMAIL_SMTP_PORT,
    EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER,
    EMAIL_SMTP_PASS: process.env.EMAIL_SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
  },
  emptyStringAsUndefined: true,
  // En scripts (seed) no queremos fallo por NEXTAUTH_SECRET ausente.
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
