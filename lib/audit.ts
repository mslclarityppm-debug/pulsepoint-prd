// Audit logging for sensitive data access (PHI)
// Logs access to health metrics and other protected data
import "server-only";

import { eq, desc, lt } from "drizzle-orm";

import { db } from "@/db";
import { auditLogs, revokedSessions } from "@/db/schema";

export type AuditAction = 
  | "health_metric_view"
  | "health_metric_create"
  | "health_metric_update"
  | "health_metric_delete"
  | "session_create"
  | "session_revoke"
  | "password_change"
  | "login_success"
  | "login_failure"
  | "data_export";

export async function logAuditEvent(params: {
  userId: number;
  action: AuditAction;
  resourceType?: string;
  resourceId?: number;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  await db.insert(auditLogs).values({
    userId: params.userId,
    action: params.action,
    resourceType: params.resourceType ?? null,
    resourceId: params.resourceId ?? null,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    ipAddress: params.ipAddress ?? null,
  });
}

export async function getAuditLogs(
  userId: number,
  limit: number = 50
): Promise<Array<{
  id: number;
  userId: number;
  action: string;
  resourceType: string | null;
  resourceId: number | null;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
}>> {
  const rows = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
  return rows;
}

// Session revocation for secure logout
export async function revokeSession(userId: number, tokenId: string): Promise<void> {
  await db.insert(revokedSessions).values({
    userId,
    tokenId,
  });
}

export async function isSessionRevoked(tokenId: string): Promise<boolean> {
  const rows = await db
    .select({ id: revokedSessions.id })
    .from(revokedSessions)
    .where(eq(revokedSessions.tokenId, tokenId))
    .limit(1);
  return rows.length > 0;
}

export async function cleanupRevokedSessions(olderThanDays: number = 30): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);
  const cutoffISO = cutoff.toISOString();
  await db
    .delete(revokedSessions)
    .where(lt(revokedSessions.revokedAt, cutoffISO));
}

// Middleware to log health data access
export async function withAuditLog<T>(
  userId: number,
  action: AuditAction,
  operation: () => Promise<T>,
  context?: { resourceType?: string; resourceId?: number; ipAddress?: string }
): Promise<T> {
  const result = await operation();
  await logAuditEvent({
    userId,
    action,
    ...(context?.resourceType && { resourceType: context.resourceType }),
    ...(context?.resourceId && { resourceId: context.resourceId }),
    ...(context?.ipAddress && { ipAddress: context.ipAddress }),
  });
  return result;
}