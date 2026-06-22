// Sistema de autenticación por sesión basado en cookies firmadas (JWT).
// Sin OAuth externo: email + password con bcryptjs.
import "server-only";
import crypto from "crypto";

import bcrypt from "bcryptjs";
import { eq, and, gt, lt } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import { db } from "@/db";
import { users, userProfiles, passwordResetTokens, revokedSessions } from "@/db/schema";
import { isSessionRevoked } from "@/lib/audit";
import { env } from "@/lib/env";

export const SESSION_COOKIE_NAME = "los8_session";
const SESSION_MAX_AGE_DAYS = parseInt(process.env.SESSION_MAX_AGE_DAYS || '7', 10);

export type SessionUser = {
  id: number;
  email: string;
  role: "user" | "admin";
  nombre?: string | null;
};

// Hashea una contraseña con bcrypt (10 rounds, estándar actual).
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verifica una contraseña contra su hash.
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Crea una cookie de sesión firmada con JWT.
// Incluye jti (JWT ID) for session revocation support.
export async function createSession(userId: number): Promise<void> {
  const sessionId = crypto.randomUUID();
  const token = jwt.sign(
    { uid: userId, jti: sessionId, iat: Math.floor(Date.now() / 1000) },
    env.SESSION_SECRET,
    {
      expiresIn: `${SESSION_MAX_AGE_DAYS}d`,
      algorithm: 'HS256',
    }
  );
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_MAX_AGE_DAYS,
  });
}

// Elimina la sesión (cookie) y registra la revocación.
export async function destroySession(sessionId?: string): Promise<void> {
  const cookieStore = cookies();
  
  // Revoke the session in database if we have a session ID
  if (sessionId) {
    await db.insert(revokedSessions).values({
      userId: 0, // Will be updated with actual userId from token
      tokenId: sessionId,
    });
  }
  
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Recupera el usuario actual desde la cookie. Devuelve null si no hay sesión válida o está revocada.
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    // Verificar token JWT
    const decoded = jwt.verify(token, env.SESSION_SECRET, { algorithms: ['HS256'] }) as { uid?: number; jti?: string; iat?: number };
    if (!decoded?.uid) return null;
    
    // Check if session is revoked
    if (decoded.jti && await isSessionRevoked(decoded.jti)) {
      return null;
    }

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        nombre: userProfiles.nombre,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.id, decoded.uid))
      .limit(1);

    const u = rows?.[0];
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      role: (u.role === "admin" ? "admin" : "user") as "user" | "admin",
      nombre: u.nombre ?? null,
    };
  } catch {
    return null;
  }
}

// Requiere usuario autenticado (lanza redirect en caso contrario - usar en layouts/pages).
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return user as SessionUser;
}

// Requiere rol admin.
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    const { redirect } = await import("next/navigation");
    redirect("/panel");
  }
  return user;
}

// Genera un token de reseteo de contraseña y lo guarda en la base de datos.
// Invalida tokens previos para el usuario.
export async function generateResetToken(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  // Invalidar tokens previos
  await db
    .update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.userId, userId));

  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return token;
}

// Valida un token de reseteo de contraseña y lo marca como usado si es válido.
// Retorna el userId si válido, null si inválido.
export async function validateResetToken(token: string): Promise<number | null> {
  const now = new Date().toISOString();

  const candidates = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      tokenHash: passwordResetTokens.tokenHash,
    })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, now)
      )
    )
    .limit(10);

  for (const candidate of candidates) {
    const isMatch = await bcrypt.compare(token, candidate.tokenHash);
    if (isMatch) {
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, candidate.id));
      return candidate.userId;
    }
  }

  return null;
}

// Limpia tokens expirados (llamar periódicamente).
export async function cleanupExpiredTokens(): Promise<void> {
  const now = new Date().toISOString();
  await db
    .delete(passwordResetTokens)
    .where(lt(passwordResetTokens.expiresAt, now));
}