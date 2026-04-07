import { Router, type IRouter } from "express";
import { eq, and, sql, gte, lt } from "drizzle-orm";
import { db, challengesTable, participationsTable, progressLogsTable } from "@workspace/db";
import { getChallengeState, computeDailyProgress } from "../lib/challengeUtils";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  const participations = await db
    .select({ challengeId: participationsTable.challengeId })
    .from(participationsTable)
    .where(eq(participationsTable.userId, userId));

  if (participations.length === 0) {
    res.json({
      totalCompletedToday: 0,
      completedChallengesToday: 0,
      totalChallenges: 0,
      activeChallenges: 0,
    });
    return;
  }

  const challengeIds = participations.map((p) => p.challengeId);
  const challenges = await db
    .select()
    .from(challengesTable)
    .where(sql`${challengesTable.id} IN (${sql.join(challengeIds.map(id => sql`${id}`), sql`, `)})`);

  let totalCompletedToday = 0;
  let completedChallengesToday = 0;
  let activeChallenges = 0;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  for (const challenge of challenges) {
    const state = getChallengeState(challenge.startDate, challenge.durationDays);
    if (state === "active") {
      activeChallenges++;

      if (challenge.type === "daily") {
        const logs = await db
          .select()
          .from(progressLogsTable)
          .where(
            and(
              eq(progressLogsTable.challengeId, challenge.id),
              eq(progressLogsTable.userId, userId)
            )
          );
        const days = computeDailyProgress(
          logs,
          challenge.startDate,
          challenge.durationDays,
          challenge.targetValue,
          challenge.dailyTargets as number[] | null,
          challenge.noMax ?? false,
          now,
        );
        const todayDay = days.find((d) => d.date === todayStr);
        totalCompletedToday += todayDay?.logged ?? 0;
        if (todayDay?.completed) {
          completedChallengesToday++;
        }
      } else {
        const todayLogs = await db
          .select()
          .from(progressLogsTable)
          .where(
            and(
              eq(progressLogsTable.challengeId, challenge.id),
              eq(progressLogsTable.userId, userId),
              gte(progressLogsTable.date, todayStart),
              lt(progressLogsTable.date, tomorrowStart)
            )
          );
        const todayTotal = todayLogs.reduce((sum, l) => sum + l.value, 0);
        totalCompletedToday += todayTotal;

        const allLogs = await db
          .select()
          .from(progressLogsTable)
          .where(
            and(
              eq(progressLogsTable.challengeId, challenge.id),
              eq(progressLogsTable.userId, userId)
            )
          );
        const overallTotal = allLogs.reduce((sum, l) => sum + l.value, 0);
        if (overallTotal >= challenge.targetValue) {
          completedChallengesToday++;
        }
      }
    }
  }

  res.json({
    totalCompletedToday,
    completedChallengesToday,
    totalChallenges: challenges.length,
    activeChallenges,
  });
});

export default router;
