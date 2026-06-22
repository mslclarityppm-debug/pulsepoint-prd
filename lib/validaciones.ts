// Esquemas Zod compartidos para validación de entrada.
import { z } from "zod";

const getAllowedRegisterDomains = (): string[] => {
  const domains = process.env.ALLOWED_REGISTER_DOMAINS?.trim();
  if (!domains) return [];
  // Parse domains like "@morningview.top,@empresa.com" into array
  return domains
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
};

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Introduce un email válido")
  .refine((val: string) => {
    const allowed = getAllowedRegisterDomains();
    if (allowed.length === 0) return true;
    return allowed.some((domain) => val.endsWith(domain));
  }, {
    message: (() => {
      const allowed = getAllowedRegisterDomains();
      if (allowed.length === 0)
        return "Introduce un email válido";
      return `El registro solo está permitido para: ${allowed.join(", ")}`;
    })() as string,
  });

export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "La contraseña debe contener al menos una letra mayúscula")
  .regex(/[a-z]/, "La contraseña debe contener al menos una letra minúscula")
  .regex(/\d/, "La contraseña debe contener al menos un número")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    "La contraseña debe contener al menos un carácter especial"
  );

export const registroSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmar: z.string(),
    nombre: z.string().trim().min(1, "Introduce tu nombre"),
    apellidos: z.string().trim().optional().default(""),
    fechaNacimiento: z.string().optional(),
    sexo: z.enum(["hombre", "mujer", "otro"]).optional(),
    telefono: z.string().optional(),
    consentimientoGdpr: z.coerce
      .boolean()
      .refine((v) => v === true, {
        message: "Debes aceptar el tratamiento de datos (GDPR)",
      }),
    consentimientoSalud: z.coerce
      .boolean()
      .refine((v) => v === true, {
        message: "Debes aceptar el consentimiento de datos de salud",
      }),
  })
  .refine((d) => d.password === d.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Introduce tu contraseña"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token requerido"),
    password: passwordSchema,
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

export const metricaPesoSchema = z.object({
  tipo: z.literal("peso"),
  valorPesoKg: z
    .coerce
    .number()
    .min(20, "Peso demasiado bajo")
    .max(400, "Peso demasiado alto"),
  fecha: z.string().min(1, "Introduce la fecha"),
  notas: z.string().optional(),
});

export const metricaTensionSchema = z.object({
  tipo: z.literal("tension"),
  sistolica: z
    .coerce
    .number()
    .int()
    .min(60, "Sistólica demasiado baja")
    .max(260, "Sistólica demasiado alta"),
  diastolica: z
    .coerce
    .number()
    .int()
    .min(30, "Diastólica demasiado baja")
    .max(180, "Diastólica demasiado alta"),
  frecuenciaCardiaca: z
    .coerce
    .number()
    .int()
    .min(30)
    .max(240)
    .optional(),
  fecha: z.string().min(1, "Introduce la fecha"),
  notas: z.string().optional(),
});

export const metricaSchema = z.discriminatedUnion("tipo", [
  metricaPesoSchema,
  metricaTensionSchema,
]);

export const contenidoSchema = z.object({
  tipo: z.enum(["video", "infografia", "articulo"]),
  titulo: z.string().trim().min(1, "Introduce el título"),
  descripcion: z.string().optional().default(""),
  url: z.string().url("Debe ser una URL válida"),
  categoria: z.string().optional(),
  orden: z.coerce.number().int().min(0).default(0),
  activo: z.coerce.boolean().default(true),
});

export const consultaNuevaSchema = z.object({
  asunto: z.string().trim().min(1, "Introduce un asunto"),
  mensaje: z.string().trim().min(1, "Escribe tu mensaje"),
});

export const consultaMensajeSchema = z.object({
  consultationId: z.coerce.number().int().positive(),
  mensaje: z.string().trim().min(1, "Escribe un mensaje"),
});