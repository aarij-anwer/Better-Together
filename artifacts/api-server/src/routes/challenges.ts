import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, challengesTable, participationsTable, progressLogsTable, usersTable } from "@workspace/db";
import {
  CreateChallengeBody,
  LogProgressBody,
} from "@workspace/api-zod";
import {
  getUnitForActivity,
  generateSlug,
  generateInviteCode,
  getChallengeState,
  computeDailyProgress,
  computeAllocatedTotal,
  computeStreak,
  getClientNow,
} from "../lib/challengeUtils";
import { computeChallengeProgress, getCurrentDay } from "../lib/utils";
import { generateDailyTargets } from "@workspace/shared";

const router: IRouter = Router();

function getParam(params: Record<string, string | string[]>, key: string): string {
  const val = params[key];
  return Array.isArray(val) ? val[0] : val;
}

async function findChallengeBySlugOrId(slugOrId: string) {
  let [challenge] = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.slug, slugOrId));
  if (!challenge) {
    [challenge] = await db
      .select()
      .from(challengesTable)
      .where(eq(challengesTable.id, slugOrId));
  }
  return challenge ?? null;
}

async function requireParticipant(userId: string, challengeId: string) {
  const [participation] = await db
    .select()
    .from(participationsTable)
    .where(
      and(
        eq(participationsTable.userId, userId),
        eq(participationsTable.challengeId, challengeId)
      )
    );
  return participation;
}

router.get("/challenges", async (req, res): Promise<void> => {
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
    res.json([]);
    return;
  }

  const challengeIds = participations.map((p) => p.challengeId);
  const challenges = await db
    .select()
    .from(challengesTable)
    .where(sql`${challengesTable.id} IN (${sql.join(challengeIds.map(id => sql`${id}`), sql`, `)})`);

  const result = await Promise.all(
    challenges.map(async (challenge) => {
      const logs = await db
        .select()
        .from(progressLogsTable)
        .where(
          and(
            eq(progressLogsTable.challengeId, challenge.id),
            eq(progressLogsTable.userId, userId)
          )
        );

      const clientNow = getClientNow(req.headers["x-timezone-offset"] as string | undefined);
      const state = getChallengeState(challenge.startDate, challenge.durationDays, clientNow);
      const progress = computeChallengeProgress({
        logs,
        startDate: challenge.startDate,
        durationDays: challenge.durationDays,
        targetValue: challenge.targetValue,
        type: challenge.type as "daily" | "total",
        dailyTargets: challenge.dailyTargets as number[] | null,
        clientNow,
      });

      const participantCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(participationsTable)
        .where(eq(participationsTable.challengeId, challenge.id));

      return {
        ...challenge,
        startDate: challenge.startDate.toISOString(),
        createdAt: challenge.createdAt.toISOString(),
        state,
        totalLogged: progress.totalLogged,
        todayLogged: progress.todayLogged,
        todayTarget: progress.todayTarget,
        currentDay: getCurrentDay(challenge.startDate, challenge.durationDays, clientNow),
        participantCount: participantCount[0]?.count ?? 0,
        dailyTargets: challenge.dailyTargets,
        randomizeReps: challenge.randomizeReps,
        restDayEnabled: challenge.restDayEnabled,
      };
    })
  );

  res.json(result);
});

router.post("/challenges", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateChallengeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, activityType, type, targetValue, durationDays, startDate, randomizeReps, restDayEnabled, dailyTargets: providedDailyTargets } = parsed.data;
  const unit = getUnitForActivity(activityType);

  const shouldRandomize = randomizeReps ?? false;
  const shouldRestDay = restDayEnabled ?? false;
  let resolvedDailyTargets: number[] | null = providedDailyTargets ?? null;

  if (resolvedDailyTargets) {
    if (resolvedDailyTargets.length !== durationDays) {
      res.status(400).json({ error: "dailyTargets length must match durationDays" });
      return;
    }
    if (resolvedDailyTargets.some((t) => !Number.isInteger(t) || t < 0)) {
      res.status(400).json({ error: "dailyTargets must contain non-negative integers" });
      return;
    }
  }

  if (!resolvedDailyTargets && (shouldRandomize || shouldRestDay)) {
    resolvedDailyTargets = generateDailyTargets({
      baseTarget: targetValue,
      durationDays,
      restDayEnabled: shouldRestDay,
      randomizeReps: shouldRandomize,
    });
  }

  let inviteCode = generateInviteCode();
  let retries = 0;
  while (retries < 5) {
    const [existing] = await db
      .select({ id: challengesTable.id })
      .from(challengesTable)
      .where(eq(challengesTable.inviteCode, inviteCode));
    if (!existing) break;
    inviteCode = generateInviteCode();
    retries++;
  }

  let slug = generateSlug(title);
  let slugRetries = 0;
  while (slugRetries < 10) {
    const [existing] = await db
      .select({ id: challengesTable.id })
      .from(challengesTable)
      .where(eq(challengesTable.slug, slug));
    if (!existing) break;
    slug = `${generateSlug(title)}-${Math.floor(Math.random() * 9999)}`;
    slugRetries++;
  }

  const resolvedStartDate = startDate ? new Date(startDate) : new Date();
  const startOfDay = new Date(resolvedStartDate.getFullYear(), resolvedStartDate.getMonth(), resolvedStartDate.getDate());

  const [challenge] = await db
    .insert(challengesTable)
    .values({
      title,
      slug,
      activityType,
      unit,
      type,
      targetValue,
      durationDays,
      startDate: startOfDay,
      createdById: req.user.id,
      inviteCode,
      dailyTargets: resolvedDailyTargets,
      randomizeReps: shouldRandomize,
      restDayEnabled: shouldRestDay,
    })
    .returning();

  await db.insert(participationsTable).values({
    userId: req.user.id,
    challengeId: challenge.id,
  });

  const clientNowCreate = getClientNow(req.headers["x-timezone-offset"] as string | undefined);
  const state = getChallengeState(challenge.startDate, challenge.durationDays, clientNowCreate);

  res.status(201).json({
    ...challenge,
    startDate: challenge.startDate.toISOString(),
    createdAt: challenge.createdAt.toISOString(),
    state,
    participantCount: 1,
  });
});

router.get("/challenges/preview/:inviteCode", async (req, res): Promise<void> => {
  const raw = getParam(req.params, "inviteCode");

  const [challenge] = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.inviteCode, raw));

  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const participantCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(participationsTable)
    .where(eq(participationsTable.challengeId, challenge.id));

  const clientNowPreview = getClientNow(req.headers["x-timezone-offset"] as string | undefined);
  const state = getChallengeState(challenge.startDate, challenge.durationDays, clientNowPreview);

  res.json({
    title: challenge.title,
    activityType: challenge.activityType,
    unit: challenge.unit,
    type: challenge.type,
    targetValue: challenge.targetValue,
    durationDays: challenge.durationDays,
    startDate: challenge.startDate.toISOString(),
    state,
    participantCount: participantCount[0]?.count ?? 0,
  });
});

router.post("/challenges/join/:inviteCode", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const raw = getParam(req.params, "inviteCode");

  const [challenge] = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.inviteCode, raw));

  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const existing = await requireParticipant(req.user.id, challenge.id);
  if (existing) {
    res.status(409).json({ error: "Already joined this challenge", challengeId: challenge.id });
    return;
  }

  await db.insert(participationsTable).values({
    userId: req.user.id,
    challengeId: challenge.id,
  });

  res.json({ challengeId: challenge.id, slug: challenge.slug, message: "Joined successfully" });
});

router.post("/challenges/:id/leave", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const slugOrId = getParam(req.params, "id");

  const challenge = await findChallengeBySlugOrId(slugOrId);
  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const participation = await requireParticipant(req.user.id, challenge.id);
  if (!participation) {
    res.status(403).json({ error: "Not a participant" });
    return;
  }

  await db.delete(participationsTable).where(
    and(
      eq(participationsTable.userId, req.user.id),
      eq(participationsTable.challengeId, challenge.id)
    )
  );

  await db.delete(progressLogsTable).where(
    and(
      eq(progressLogsTable.userId, req.user.id),
      eq(progressLogsTable.challengeId, challenge.id)
    )
  );

  res.json({ message: "Left challenge successfully" });
});

router.get("/challenges/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const slugOrId = getParam(req.params, "id");

  const challenge = await findChallengeBySlugOrId(slugOrId);
  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const participation = await requireParticipant(req.user.id, challenge.id);
  if (!participation) {
    res.status(403).json({ error: "Not a participant" });
    return;
  }

  const clientNow = getClientNow(req.headers["x-timezone-offset"] as string | undefined);
  const state = getChallengeState(challenge.startDate, challenge.durationDays, clientNow);

  const participantCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(participationsTable)
    .where(eq(participationsTable.challengeId, challenge.id));

  const userLogs = await db
    .select()
    .from(progressLogsTable)
    .where(
      and(
        eq(progressLogsTable.challengeId, challenge.id),
        eq(progressLogsTable.userId, req.user.id)
      )
    );

  const progress = computeChallengeProgress({
    logs: userLogs,
    startDate: challenge.startDate,
    durationDays: challenge.durationDays,
    targetValue: challenge.targetValue,
    type: challenge.type as "daily" | "total",
    dailyTargets: challenge.dailyTargets as number[] | null,
    clientNow,
  });

  let streak = 0;
  if (challenge.type === "daily" && progress.days) {
    streak = computeStreak(progress.days, challenge.startDate, clientNow);
  }

  const leaderboard = await buildLeaderboard(challenge, clientNow);

  res.json({
    challenge: {
      ...challenge,
      startDate: challenge.startDate.toISOString(),
      createdAt: challenge.createdAt.toISOString(),
      state,
      participantCount: participantCount[0]?.count ?? 0,
      dailyTargets: challenge.dailyTargets,
      randomizeReps: challenge.randomizeReps,
      restDayEnabled: challenge.restDayEnabled,
    },
    userProgress: {
      totalLogged: progress.totalLogged,
      totalTarget: progress.totalTarget,
      todayLogged: progress.todayLogged,
      todayTarget: progress.todayTarget,
      streak,
      ...(progress.days ? { days: progress.days } : {}),
    },
    leaderboard,
    streak,
  });
});

router.post("/challenges/:id/log", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const slugOrId = getParam(req.params, "id");

  const challenge = await findChallengeBySlugOrId(slugOrId);
  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const challengeId = challenge.id;

  const participation = await requireParticipant(req.user.id, challengeId);
  if (!participation) {
    res.status(403).json({ error: "Not a participant" });
    return;
  }

  const clientNow = getClientNow(req.headers["x-timezone-offset"] as string | undefined);
  const state = getChallengeState(challenge.startDate, challenge.durationDays, clientNow);
  if (state === "not_started") {
    res.status(400).json({ error: "Challenge has not started yet" });
    return;
  }
  if (state === "completed") {
    res.status(400).json({ error: "Challenge has already ended" });
    return;
  }

  const parsed = LogProgressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let valueToLog = parsed.data.value;

  const challengeDailyTargets = challenge.dailyTargets as number[] | null;

  if (challengeDailyTargets) {
    const currentDay = getCurrentDay(challenge.startDate, challenge.durationDays, clientNow);
    const todayTarget = challengeDailyTargets[currentDay - 1] ?? 0;
    if (todayTarget === 0) {
      res.status(400).json({ error: "Today is a rest day — no progress can be logged" });
      return;
    }
  }

  const existingLogs = await db
    .select()
    .from(progressLogsTable)
    .where(
      and(
        eq(progressLogsTable.challengeId, challengeId),
        eq(progressLogsTable.userId, req.user.id)
      )
    );

  if (challenge.type === "daily") {
    const currentDay = getCurrentDay(challenge.startDate, challenge.durationDays, clientNow);
    const daysUpToToday = challengeDailyTargets
      ? challengeDailyTargets.slice(0, currentDay)
      : Array.from({ length: currentDay }, () => challenge.targetValue);
    const maxTotalToDate = daysUpToToday.reduce((sum, t) => sum + t, 0);
    const allocatedTotal = computeAllocatedTotal(existingLogs, challenge.startDate, challenge.durationDays, challenge.targetValue, challengeDailyTargets);
    const remaining = maxTotalToDate - allocatedTotal;
    if (remaining <= 0) {
      res.status(400).json({ error: "Challenge fully completed, no more progress can be logged" });
      return;
    }
    valueToLog = Math.min(valueToLog, remaining);
  }

  const now = clientNow;
  await db.insert(progressLogsTable).values({
    userId: req.user.id,
    challengeId,
    date: now,
    value: valueToLog,
  });

  const allLogs = [...existingLogs, { date: now, value: valueToLog, userId: req.user.id, challengeId, id: "", createdAt: now }];

  const progress = computeChallengeProgress({
    logs: allLogs,
    startDate: challenge.startDate,
    durationDays: challenge.durationDays,
    targetValue: challenge.targetValue,
    type: challenge.type as "daily" | "total",
    dailyTargets: challengeDailyTargets,
    clientNow,
  });

  res.json({
    totalLogged: progress.totalLogged,
    totalTarget: progress.totalTarget,
    todayLogged: progress.todayLogged,
    todayTarget: progress.todayTarget,
    valueLogged: valueToLog,
    ...(progress.days ? { days: progress.days } : {}),
  });
});

router.get("/challenges/:id/progress", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const slugOrId = getParam(req.params, "id");

  const challenge = await findChallengeBySlugOrId(slugOrId);
  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const participation = await requireParticipant(req.user.id, challenge.id);
  if (!participation) {
    res.status(403).json({ error: "Not a participant" });
    return;
  }

  const logs = await db
    .select()
    .from(progressLogsTable)
    .where(
      and(
        eq(progressLogsTable.challengeId, challenge.id),
        eq(progressLogsTable.userId, req.user.id)
      )
    );

  const clientNow = getClientNow(req.headers["x-timezone-offset"] as string | undefined);
  const progress = computeChallengeProgress({
    logs,
    startDate: challenge.startDate,
    durationDays: challenge.durationDays,
    targetValue: challenge.targetValue,
    type: challenge.type as "daily" | "total",
    dailyTargets: challenge.dailyTargets as number[] | null,
    clientNow,
  });

  let streak = 0;
  if (challenge.type === "daily" && progress.days) {
    streak = computeStreak(progress.days, challenge.startDate, clientNow);
  }

  res.json({
    totalLogged: progress.totalLogged,
    totalTarget: progress.totalTarget,
    todayLogged: progress.todayLogged,
    todayTarget: progress.todayTarget,
    streak,
    ...(progress.days ? { days: progress.days } : {}),
    dailyTargets: challenge.dailyTargets ?? undefined,
    randomizeReps: challenge.randomizeReps ?? undefined,
    restDayEnabled: challenge.restDayEnabled ?? undefined,
  });
});

router.get("/challenges/:id/leaderboard", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const slugOrId = getParam(req.params, "id");

  const challenge = await findChallengeBySlugOrId(slugOrId);
  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const participation = await requireParticipant(req.user.id, challenge.id);
  if (!participation) {
    res.status(403).json({ error: "Not a participant" });
    return;
  }

  const clientNow = getClientNow(req.headers["x-timezone-offset"] as string | undefined);
  const leaderboard = await buildLeaderboard(challenge, clientNow);
  res.json(leaderboard);
});

async function buildLeaderboard(challenge: typeof challengesTable.$inferSelect, clientNow?: Date) {
  const participants = await db
    .select({
      userId: participationsTable.userId,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(participationsTable)
    .innerJoin(usersTable, eq(participationsTable.userId, usersTable.id))
    .where(eq(participationsTable.challengeId, challenge.id));

  const state = getChallengeState(challenge.startDate, challenge.durationDays, clientNow);

  if (state === "not_started") {
    return participants.map((p) => {
      const userName = [p.firstName, p.lastName].filter(Boolean).join(" ") || "User";
      return {
        userId: p.userId,
        userName,
        profileImageUrl: p.profileImageUrl,
        totalLogged: 0,
        percentComplete: 0,
        rank: 0,
        streak: 0,
      };
    });
  }

  const entries = await Promise.all(
    participants.map(async (p) => {
      const logs = await db
        .select()
        .from(progressLogsTable)
        .where(
          and(
            eq(progressLogsTable.challengeId, challenge.id),
            eq(progressLogsTable.userId, p.userId)
          )
        );

      const progress = computeChallengeProgress({
        logs,
        startDate: challenge.startDate,
        durationDays: challenge.durationDays,
        targetValue: challenge.targetValue,
        type: challenge.type as "daily" | "total",
        dailyTargets: challenge.dailyTargets as number[] | null,
        clientNow,
      });

      let streak = 0;
      if (challenge.type === "daily" && progress.days) {
        streak = computeStreak(progress.days, challenge.startDate, clientNow);
      }

      const percentComplete = progress.totalTarget > 0 ? Math.round((progress.totalLogged / progress.totalTarget) * 10000) / 100 : 0;

      const userName = [p.firstName, p.lastName].filter(Boolean).join(" ") || "User";

      return {
        userId: p.userId,
        userName,
        profileImageUrl: p.profileImageUrl,
        totalLogged: progress.totalLogged,
        percentComplete,
        rank: 0,
        streak,
      };
    })
  );

  entries.sort((a, b) => {
    if (b.totalLogged !== a.totalLogged) return b.totalLogged - a.totalLogged;
    return b.percentComplete - a.percentComplete;
  });

  entries.forEach((e, i) => {
    e.rank = i + 1;
  });

  return entries;
}

export default router;
