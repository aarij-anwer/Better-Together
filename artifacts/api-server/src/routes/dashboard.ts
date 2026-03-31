import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
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
  const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split("T")[0];

  for (const challenge of challenges) {
    const state = getChallengeState(challenge.startDate, challenge.durationDays);
    if (state === "active") {
      activeChallenges++;

      const logs = await db
        .select()
        .from(progressLogsTable)
        .where(
          and(
            eq(progressLogsTable.challengeId, challenge.id),
            eq(progressLogsTable.userId, userId)
          )
        );

      if (challenge.type === "daily") {
        const days = computeDailyProgress(logs, challenge.startDate, challenge.durationDays, challenge.targetValue);
        const todayDay = days.find((d) => d.date === todayStr);
        const todayVal = todayDay?.logged ?? 0;
        totalCompletedToday += todayVal;
        if (todayDay?.completed) {
          completedChallengesToday++;
        }
      } else {
        const totalLogged = logs.reduce((sum, l) => sum + l.value, 0);
        totalCompletedToday += totalLogged;
        if (totalLogged >= challenge.targetValue) {
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
