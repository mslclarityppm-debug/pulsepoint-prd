// Panel principal con gamificación y progreso
import { and, gte, count, eq, desc } from "drizzle-orm";
import { Activity, CheckCircle2, Trophy, FileText } from "lucide-react";
import { redirect } from "next/navigation";

import { getUserBadges } from "@/actions/achievements";
import { getUserConsistencyScore } from "@/lib/achievements-utils";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { healthMetrics, questionnaireResponses } from "@/db/schema";

export default async function PanelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [score, badges, recentMetrics, recentQuestionnaires] = await Promise.all([
    getUserConsistencyScore(user.id),
    getUserBadges(user.id),
    db
      .select()
      .from(healthMetrics)
      .where(eq(healthMetrics.userId, user.id))
      .orderBy(desc(healthMetrics.fecha))
      .limit(5),
    db
      .select()
      .from(questionnaireResponses)
      .where(eq(questionnaireResponses.userId, user.id))
      .orderBy(desc(questionnaireResponses.fecha))
      .limit(3),
  ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0] || "";

  const monthMetrics = await db
    .select({ count: count() })
    .from(healthMetrics)
    .where(
      and(
        eq(healthMetrics.userId, user.id),
        gte(healthMetrics.fecha, thirtyDaysAgoStr)
      )
    );

  const monthQuestionnaires = await db
    .select({ count: count() })
    .from(questionnaireResponses)
    .where(
      and(
        eq(questionnaireResponses.userId, user.id),
        gte(questionnaireResponses.fecha, thirtyDaysAgoStr)
      )
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          Panel de Control
        </h1>
        <p className="text-muted-foreground mt-1">
          Tu progreso y actividad reciente
        </p>
      </div>

      {/* Consistency Score Card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="font-display text-xl font-semibold">Consistencia</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <div className="text-3xl font-bold text-primary">{score.score}</div>
            <div className="text-xs text-muted-foreground mt-1">Score</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold">{monthMetrics[0]?.count || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Métricas</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold">{monthQuestionnaires[0]?.count || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Cuestionarios</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Métricas (últimos 30 días)</span>
            <span className="font-medium">{score.breakdown.metrics}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${score.breakdown.metrics}%` }}></div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cuestionarios</span>
            <span className="font-medium">{score.breakdown.questionnaires}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${score.breakdown.questionnaires}%` }}></div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <h2 className="font-display text-xl font-semibold">Logros</h2>
        </div>
        {badges.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge) => (
              <div key={badge.id} className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl mb-1">{getBadgeEmoji(badge.badgeId)}</div>
                <div className="text-xs font-medium">{getBadgeLabel(badge.badgeId)}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Completa actividades para desbloquear logros
          </p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold mb-4">Actividad Reciente</h2>
        <div className="space-y-4">
          {recentMetrics.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Activity className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="font-medium">
                  {m.tipo === 'peso' ? 'Peso registrado' : 'Tensión arterial'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {m.fecha}
                </div>
              </div>
            </div>
          ))}
          {recentQuestionnaires.map((q) => (
            <div key={q.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <div className="font-medium">Cuestionario completado</div>
                <div className="text-sm text-muted-foreground">
                  {q.fecha} - Puntuación: {q.puntuacion}
                </div>
              </div>
            </div>
          ))}
          {(recentMetrics.length === 0 && recentQuestionnaires.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay actividad reciente. ¡Comienza registrando tus métricas!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getBadgeEmoji(badgeId: string) {
  const emojis: Record<string, string> = {
    streak_7: '🔥',
    streak_14: '⚡',
    streak_30: '🏆',
    profile_complete: '✅',
    scan_10: '📷',
    scan_50: '📸',
    scan_100: '🎬',
    article_5: '📚',
    article_10: '🎓',
    article_20: '🏅',
    metric_improve: '📈',
  };
  return emojis[badgeId] || '🎖️';
}

function getBadgeLabel(badgeId: string) {
  const labels: Record<string, string> = {
    streak_7: '7 días',
    streak_14: '14 días',
    streak_30: '30 días',
    profile_complete: 'Perfil completo',
    scan_10: '10 escaneos',
    scan_50: '50 escaneos',
    scan_100: '100 escaneos',
    article_5: '5 artículos',
    article_10: '10 artículos',
    article_20: '20 artículos',
    metric_improve: 'Mejora continua',
  };
  return labels[badgeId] || badgeId;
}

