import { cache } from 'react';
import { eq, desc } from 'drizzle-orm';

// Tipos de badges disponibles
export const BADGES = {
  STREAK_7: 'streak_7',
  STREAK_14: 'streak_14',
  STREAK_30: 'streak_30',
  PROFILE_COMPLETE: 'profile_complete',
  SCAN_10: 'scan_10',
  SCAN_50: 'scan_50',
  SCAN_100: 'scan_100',
  ARTICLE_5: 'article_5',
  ARTICLE_10: 'article_10',
  ARTICLE_20: 'article_20',
  METRIC_IMPROVE: 'metric_improve',
} as const;

export type BadgeId = typeof BADGES[keyof typeof BADGES];

/**
 * Calcula el streak actual del usuario
 */
export const getUserCurrentStreak = cache(async (userId: number) => {
  const { db } = await import('@/db');
  const { streaks } = await import('@/db/schema');

  const allStreaks = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId))
    .orderBy(desc(streaks.date));

  if (allStreaks.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Streak actual desde hoy hacia atras
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = 0;
  for (let i = 0; i < allStreaks.length; i++) {
    const streak = allStreaks[i];
    if (!streak?.date) break;
    const streakDate = new Date(streak.date);
    streakDate.setHours(0, 0, 0, 0);

    const diff = Math.floor((today.getTime() - streakDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === current) {
      current++;
    } else {
      break;
    }
  }

  // Streak mas largo
  const sorted = allStreaks
    .map((s) => (s.date ? new Date(s.date) : null))
    .filter((d): d is Date => d !== null)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .sort((a, b) => a!.getTime() - b!.getTime());

  let longest = 0;
  let temp = 0;

  for (let i = 0; i < sorted.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const curr = sorted[i]!;
    if (i === 0) {
      temp = 1;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const prev = sorted[i - 1]!;
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        temp++;
      } else if (diff > 1) {
        longest = Math.max(longest, temp);
        temp = 1;
      }
    }
  }
  longest = Math.max(longest, temp);

  return { current, longest };
});

/**
 * Calcula el score de consistencia del usuario
 */
export const getUserConsistencyScore = cache(async (userId: number) => {
  const { db } = await import('@/db');
  const { healthMetrics, questionnaireResponses } = await import('@/db/schema');
  const { and, gte } = await import('drizzle-orm');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0] || "";

  // Dias con metricas medicas
  const metricsWithDates = await db
    .select({ date: healthMetrics.fecha })
    .from(healthMetrics)
    .where(
      and(
        eq(healthMetrics.userId, userId),
        thirtyDaysAgoStr ? gte(healthMetrics.fecha, thirtyDaysAgoStr as string) : undefined
      )
    );

  const uniqueMetricDays = new Set(metricsWithDates.map((m) => m.date));
  const metricDays = uniqueMetricDays.size;

  // Cuestionarios en 30 dias
  const questionnaires = await db
    .select()
    .from(questionnaireResponses)
    .where(
      and(
        eq(questionnaireResponses.userId, userId),
        thirtyDaysAgoStr ? gte(questionnaireResponses.fecha, thirtyDaysAgoStr as string) : undefined
      )
    );

  // Dias con registro (placeholder)
  const dietLogDays = metricDays;

  // Calcular score
  const metricScore = Math.min(metricDays / 30, 1) * 0.4;
  const questionnaireScore = Math.min(questionnaires.length / 4, 1) * 0.3;
  const dietScore = Math.min(dietLogDays / 30, 1) * 0.3;

  const totalScore = Math.round((metricScore + questionnaireScore + dietScore) * 100);

  return {
    score: totalScore,
    metricDays,
    questionnaireCount: questionnaires.length,
    dietLogDays,
    period: 30,
    breakdown: {
      metrics: Math.round(metricScore * 100),
      questionnaires: Math.round(questionnaireScore * 100),
      diet: Math.round(dietScore * 100),
    },
  };
});