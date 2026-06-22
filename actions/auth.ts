// Server Actions para autenticación: registro, login, logout.
"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, userProfiles, passwordHistory } from "@/db/schema";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
  generateResetToken,
  validateResetToken,
  cleanupExpiredTokens,
} from "@/lib/auth";
import { loginSchema, registroSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validaciones";
import { checkRateLimit, checkRegistrationRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { validateCSRFToken } from "@/lib/csrf";
import { sendPasswordResetEmail } from "@/lib/email";

export type ActionState = {
  ok?: boolean;
  error?: string;
  errores?: Record<string, string>;
};

export async function accionRegistro(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const csrfToken = formData.get('csrf') as string;
  if (!(await validateCSRFToken(csrfToken))) {
    return { error: "Token CSRF inválido" };
  }

  const headersList = headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

  const rateLimitResult = await checkRegistrationRateLimit(clientIp);
  if (!rateLimitResult.allowed) {
    const resetInMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / (60 * 1000));
    return {
      error: `Demasiados intentos de registro. Inténtalo de nuevo en ${resetInMinutes} minutos.`
    };
  }

  const parsed = registroSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmar: formData.get("confirmar"),
    nombre: formData.get("nombre"),
    apellidos: formData.get("apellidos") ?? "",
    fechaNacimiento: formData.get("fechaNacimiento") ?? undefined,
    sexo: formData.get("sexo") ?? undefined,
    telefono: formData.get("telefono") ?? undefined,
    consentimientoGdpr: formData.get("consentimientoGdpr") === "on",
    consentimientoSalud: formData.get("consentimientoSalud") === "on",
  });

  if (!parsed.success) {
    const errores: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path?.[0] ?? "_");
      if (!errores[key]) errores[key] = issue.message;
    }
    return { error: "Revisa los campos marcados", errores };
  }

  const datos = parsed.data;
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, datos.email))
    .limit(1);
  if (existing?.[0]) {
    return { error: "Ya existe una cuenta con ese email" };
  }

  const passwordHash = await hashPassword(datos.password);
  const inserted = await db
    .insert(users)
    .values({ email: datos.email, passwordHash, role: "user" })
    .returning({ id: users.id });
  const newUserId = inserted?.[0]?.id;
  if (!newUserId) return { error: "No se pudo crear la cuenta" };

  await db.insert(userProfiles).values({
    userId: newUserId,
    nombre: datos.nombre,
    apellidos: datos.apellidos ?? "",
    fechaNacimiento: datos.fechaNacimiento || null,
    sexo: datos.sexo ?? null,
    telefono: datos.telefono ?? null,
    consentimientoGdpr: datos.consentimientoGdpr,
    consentimientoSalud: datos.consentimientoSalud,
  });

  await createSession(newUserId);
  revalidatePath("/");
  redirect("/panel");
}

export async function accionLogin(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Validate CSRF token
  const csrfToken = formData.get('csrf') as string;
  if (!(await validateCSRFToken(csrfToken))) {
    return { error: "Token CSRF inválido" };
  }

  // Get client IP for rate limiting
  const headersList = headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const clientIp = forwardedFor?.split(',')[0]?.trim() ||
                   realIp ||
                   'unknown';

  // Check rate limit
  const rateLimitResult = await checkRateLimit(clientIp);
  if (!rateLimitResult.allowed) {
    const resetInMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / (60 * 1000));
    return {
      error: `Demasiados intentos de inicio de sesión. Inténtalo de nuevo en ${resetInMinutes} minutos.`
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const errores: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path?.[0] ?? "_");
      if (!errores[key]) errores[key] = issue.message;
    }
    return { error: "Revisa los campos", errores };
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  const user = rows?.[0];
  if (!user) return { error: "Credenciales incorrectas" };

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return { error: "Credenciales incorrectas" };

  // Reset rate limit on successful login
  await resetRateLimit(clientIp);

  await createSession(user.id);
  revalidatePath("/");
  redirect(user.role === "admin" ? "/admin" : "/panel");
}

export async function accionLogout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function accionForgotPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Validate CSRF token
  const csrfToken = formData.get('csrf') as string;
  if (!(await validateCSRFToken(csrfToken))) {
    return { error: "Token CSRF inválido" };
  }

  // Get client IP for rate limiting
  const headersList = headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const clientIp = forwardedFor?.split(',')[0]?.trim() ||
                    realIp ||
                    'unknown';

  // Check rate limit (same as login for simplicity)
  const rateLimitResult = await checkRateLimit(clientIp);
  if (!rateLimitResult.allowed) {
    const resetInMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / (60 * 1000));
    return {
      error: `Demasiadas solicitudes. Inténtalo de nuevo en ${resetInMinutes} minutos.`
    };
  }

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    const errores: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path?.[0] ?? "_");
      if (!errores[key]) errores[key] = issue.message;
    }
    return { error: "Revisa el campo", errores };
  }

  const email = parsed.data.email;

  // Check if user exists (but don't reveal it)
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!existing?.[0]) {
    // Always return success to avoid account enumeration
    return { ok: true };
  }

  const userId = existing[0].id;

  // Generate reset token
  const resetToken = await generateResetToken(userId);

  // Cleanup expired tokens (don't await)
  cleanupExpiredTokens().catch((err) => {
    console.error("Error cleaning up expired tokens:", err);
  });

  // Send email (don't await to avoid blocking)
  sendPasswordResetEmail(email, resetToken).catch((err) => {
    console.error("Error sending password reset email:", err);
  });

  return { ok: true };
}

export async function accionResetPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Validate CSRF token
  const csrfToken = formData.get('csrf') as string;
  if (!(await validateCSRFToken(csrfToken))) {
    return { error: "Token CSRF inválido" };
  }

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmar: formData.get("confirmar"),
  });

  if (!parsed.success) {
    const errores: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path?.[0] ?? "_");
      if (!errores[key]) errores[key] = issue.message;
    }
    return { error: "Revisa los campos", errores };
  }

  const { token, password } = parsed.data;

  // Validate token
  const userId = await validateResetToken(token);
  if (!userId) {
    return { error: "Token inválido o expirado" };
  }

  // Get current password hash to check history
  const currentRows = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const currentHash = currentRows?.[0]?.passwordHash;

  // Check password history (last 5 passwords)
  const historyRows = await db
    .select({ passwordHash: passwordHistory.passwordHash })
    .from(passwordHistory)
    .where(eq(passwordHistory.userId, userId))
    .orderBy(passwordHistory.createdAt)
    .limit(5);

  for (const historyEntry of historyRows) {
    if (await verifyPassword(password, historyEntry.passwordHash)) {
      return { error: "No puedes reutilizar contraseñas anteriores" };
    }
  }

  // Update password
  const passwordHash = await hashPassword(password);
  
  // Store old password in history
  if (currentHash) {
    await db.insert(passwordHistory).values({
      userId,
      passwordHash: currentHash,
    });
  }
  
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId));

  // Get user role for redirect
  const userRows = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const role = userRows?.[0]?.role;

  // Create session
  await createSession(userId);
  revalidatePath("/");
  redirect(role === "admin" ? "/admin" : "/panel");
}
