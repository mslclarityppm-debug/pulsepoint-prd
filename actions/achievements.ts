// Server Actions para sistema de logros y streaks
"use server";
import { db } from '@/db';
import { achievements, streaks, users, userProfiles } from '@/db/schema';
import { and, desc, eq, gte, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { BADGES, type BadgeId, getUserCurrentStreak } from '@/lib/achievements-utils';

/**
 * Verifica y desbloquea badges para un usuario
 */
export async function checkAndUnlockBadges(userId: number) {
  const userBadges = await (db as any)
    .select({ badgeId: achievements.badgeId })
    .from(achievements)
    .where(eq(achievements.userId, userId));

  const unlocked = new Set(userBadges.map((b: { badgeId: string }) => b.badgeId));
  const newBadges: BadgeId[] = [];

  // Check streak badges
  const streakInfo = await getUserCurrentStreak(userId);
  if (streakInfo.current >= 7 && !unlocked.has(BADGES.STREAK_7)) {
    await unlockBadge(userId, BADGES.STREAK_7, { streak: 7 });
    newBadges.push(BADGES.STREAK_7);
  }
  if (streakInfo.current >= 14 && !unlocked.has(BADGES.STREAK_14)) {
    await unlockBadge(userId, BADGES.STREAK_14, { streak: 14 });
    newBadges.push(BADGES.STREAK_14);
  }
  if (streakInfo.current >= 30 && !unlocked.has(BADGES.STREAK_30)) {
    await unlockBadge(userId, BADGES.STREAK_30, { streak: 30 });
    newBadges.push(BADGES.STREAK_30);
  }

  // Check profile complete
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });
  if (profile && !unlocked.has(BADGES.PROFILE_COMPLETE)) {
    const isComplete =
      !!profile.nombre &&
      !!profile.apellidos &&
      !!profile.fechaNacimiento &&
      !!profile.sexo &&
      profile.consentimientoGdpr &&
      profile.consentimientoSalud;
    if (isComplete) {
      await unlockBadge(userId, BADGES.PROFILE_COMPLETE, {});
      newBadges.push(BADGES.PROFILE_COMPLETE);
    }
  }

  return newBadges;
}

/**
 * Desbloquea un badge especifico
 */
export async function unlockBadge(
  userId: number,
  badgeId: BadgeId,
  metadata: Record<string, any> = {}
) {
  // Verificar que no exista ya
  const existing = await db.query.achievements.findFirst({
    where: and(
      eq(achievements.userId, userId),
      eq(achievements.badgeId, badgeId)
    ),
  });

  if (existing) return null;

  const [result] = await db
    .insert(achievements)
    .values({
      userId,
      badgeId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
    .returning();

  revalidatePath(`/panel`);

  return result;
}

/**
 * Registra actividad diaria para streaks
 */
export async function recordDailyActivity(
  userId: number,
  activity: {
    hasMedicalMetric?: boolean;
    hasDietLog?: boolean;
    hasQuestionnaire?: boolean;
  }
) {
  const today = (new Date().toISOString().split("T")[0]) as string;

  const existing = await db.query.streaks.findFirst({
    where: and(eq(streaks.userId, userId), eq(streaks.date, today)),
  });

  if (existing) {
    return existing;
  }

  const [result] = await db
    .insert(streaks)
    .values({
      userId,
      date: today,
      hasMedicalMetric: !!activity.hasMedicalMetric,
      hasDietLog: !!activity.hasDietLog,
      hasQuestionnaire: !!activity.hasQuestionnaire,
    })
    .returning();

  // Verificar badges
  checkAndUnlockBadges(userId).catch(console.error);

  return result;
}

/**
 * Obtiene todos los badges del usuario
 */
export async function getUserBadges(userId: number) {
  const badges = await db.query.achievements.findMany({
    where: eq(achievements.userId, userId),
    orderBy: desc(achievements.unlockedAt),
  });

  return badges;
}

/**
 * Obtiene estadisticas de engagement para admin
 */
export async function getEngagementStats() {
  const totalUsers = await db.$count(users);

  const usersWithStreaks = await db.$count(streaks);

  const usersWithBadges = await db
    .select({ userId: achievements.userId })
    .from(achievements)
    .groupBy(achievements.userId);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().split("T")[0] || "";

  const activeUsers = cutoff
    ? await db
        .select({ count: count() })
        .from(streaks)
        .where(gte(streaks.date, cutoff))
         .then((r: { count?: number }[]) => r[0]?.count || 0)
    : 0;

  return {
    totalUsers,
    usersWithStreaks,
    usersWithBadges: usersWithBadges.length,
    activeUsersLast30Days: activeUsers,
    engagementRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
  };
}