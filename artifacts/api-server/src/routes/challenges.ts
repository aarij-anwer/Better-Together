import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, challengesTable, participationsTable, progressLogsTable, usersTable } from "@workspace/db";
import {
  CreateChallengeBody,
  LogProgressBody,
} from "@workspace/api-zod";
import {
  getUnitForActivity,
  generateInviteCode,
  getChallengeState,
  computeDailyProgress,
  computeStreak,
} from "../lib/challengeUtils";

const router: IRouter = Router();

function getParam(params: Record<string, string | string[]>, key: string): string {
  const val = params[key];
  return Array.isArray(val) ? val[0] : val;
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

      const state = getChallengeState(challenge.startDate, challenge.durationDays);
      const totalLogged = logs.reduce((sum, l) => sum + l.value, 0);

      let todayLogged = 0;
      let todayTarget = challenge.targetValue;

      if (challenge.type === "daily") {
        const days = computeDailyProgress(logs, challenge.startDate, challenge.durationDays, challenge.targetValue);
        const todayStr = new Date().toISOString().split("T")[0];
        const todayDay = days.find((d) => d.date === todayStr);
        todayLogged = todayDay?.logged ?? 0;
      } else {
        todayLogged = totalLogged;
        todayTarget = challenge.targetValue;
      }

      const participantCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(participationsTable)
        .where(eq(participationsTable.challengeId, challenge.id));

      return {
        ...challenge,
        startDate: challenge.startDate.toISOString(),
        createdAt: challenge.createdAt.toISOString(),
        state,
        totalLogged,
        todayLogged,
        todayTarget,
        participantCount: participantCount[0]?.count ?? 0,
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

  const { title, activityType, type, targetValue, durationDays, startDate } = parsed.data;
  const unit = getUnitForActivity(activityType);

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

  const resolvedStartDate = startDate ? new Date(startDate) : new Date();
  const startOfDay = new Date(resolvedStartDate.getFullYear(), resolvedStartDate.getMonth(), resolvedStartDate.getDate());

  const [challenge] = await db
    .insert(challengesTable)
    .values({
      title,
      activityType,
      unit,
      type,
      targetValue,
      durationDays,
      startDate: startOfDay,
      createdById: req.user.id,
      inviteCode,
    })
    .returning();

  await db.insert(participationsTable).values({
    userId: req.user.id,
    challengeId: challenge.id,
  });

  const state = getChallengeState(challenge.startDate, challenge.durationDays);

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

  const state = getChallengeState(challenge.startDate, challenge.durationDays);

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

  res.json({ challengeId: challenge.id, message: "Joined successfully" });
});

router.get("/challenges/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const challengeId = getParam(req.params, "id");

  const participation = await requireParticipant(req.user.id, challengeId);
  if (!participation) {
    res.status(403).json({ error: "Not a participant" });
    return;
  }

  const [challenge] = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.id, challengeId));

  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const state = getChallengeState(challenge.startDate, challenge.durationDays);

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

  let totalLogged: number;
  let days = undefined;
  let streak = 0;
  let todayLogged = 0;
  let todayTarget = challenge.targetValue;
  let totalTarget = challenge.type === "daily"
    ? challenge.targetValue * challenge.durationDays
    : challenge.targetValue;

  if (challenge.type === "daily") {
    const dayProgress = computeDailyProgress(userLogs, challenge.startDate, challenge.durationDays, challenge.targetValue);
    days = dayProgress;
    totalLogged = dayProgress.reduce((sum, d) => sum + d.logged, 0);
    streak = computeStreak(dayProgress, challenge.startDate);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todayDay = dayProgress.find((d) => d.date === todayStr);
    todayLogged = todayDay?.logged ?? 0;
  } else {
    totalLogged = Math.min(userLogs.reduce((sum, l) => sum + l.value, 0), totalTarget);
    todayLogged = totalLogged;
  }

  const leaderboard = await buildLeaderboard(challenge);

  res.json({
    challenge: {
      ...challenge,
      startDate: challenge.startDate.toISOString(),
      createdAt: challenge.createdAt.toISOString(),
      state,
      participantCount: participantCount[0]?.count ?? 0,
    },
    userProgress: {
      totalLogged,
      totalTarget,
      todayLogged,
      todayTarget,
      streak,
      ...(days ? { days } : {}),
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

  const challengeId = getParam(req.params, "id");

  const [challenge] = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.id, challengeId));

  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const participation = await requireParticipant(req.user.id, challengeId);
  if (!participation) {
    res.status(403).json({ error: "Not a participant" });
    return;
  }

  const state = getChallengeState(challenge.startDate, challenge.durationDays);
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
    const maxTotal = challenge.targetValue * challenge.durationDays;
    const currentTotal = existingLogs.reduce((sum, l) => sum + l.value, 0);
    const remaining = maxTotal - currentTotal;
    if (remaining <= 0) {
      res.status(400).json({ error: "Challenge fully completed, no more progress can be logged" });
      return;
    }
    valueToLog = Math.min(valueToLog, remaining);
  }

  const now = new Date();
  await db.insert(progressLogsTable).values({
    userId: req.user.id,
    challengeId,
    date: now,
    value: valueToLog,
  });

  const allLogs = [...existingLogs, { date: now, value: valueToLog, userId: req.user.id, challengeId, id: "", createdAt: now }];

  let totalLogged: number;
  let todayLogged = 0;
  let todayTarget = challenge.targetValue;
  let days = undefined;

  if (challenge.type === "daily") {
    const dayProgress = computeDailyProgress(allLogs, challenge.startDate, challenge.durationDays, challenge.targetValue);
    days = dayProgress;
    totalLogged = dayProgress.reduce((sum, d) => sum + d.logged, 0);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todayDay = dayProgress.find((d) => d.date === todayStr);
    todayLogged = todayDay?.logged ?? 0;
  } else {
    const totalTarget = challenge.targetValue;
    totalLogged = Math.min(allLogs.reduce((sum, l) => sum + l.value, 0), totalTarget);
    todayLogged = totalLogged;
  }

  res.json({
    totalLogged,
    todayLogged,
    todayTarget,
    ...(days ? { days } : {}),
  });
});

router.get("/challenges/:id/progress", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const challengeId = getParam(req.params, "id");

  const participation = await requireParticipant(req.user.id, challengeId);
  if (!participation) {
    res.status(403).json({ error: "Not a participant" });
    return;
  }

  const [challenge] = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.id, challengeId));

  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const logs = await db
    .select()
    .from(progressLogsTable)
    .where(
      and(
        eq(progressLogsTable.challengeId, challengeId),
        eq(progressLogsTable.userId, req.user.id)
      )
    );

  const totalTarget = challenge.type === "daily"
    ? challenge.targetValue * challenge.durationDays
    : challenge.targetValue;

  let totalLogged: number;
  let todayLogged = 0;
  let streak = 0;
  let days = undefined;

  if (challenge.type === "daily") {
    const dayProgress = computeDailyProgress(logs, challenge.startDate, challenge.durationDays, challenge.targetValue);
    days = dayProgress;
    totalLogged = dayProgress.reduce((sum, d) => sum + d.logged, 0);
    streak = computeStreak(dayProgress, challenge.startDate);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todayDay = dayProgress.find((d) => d.date === todayStr);
    todayLogged = todayDay?.logged ?? 0;
  } else {
    totalLogged = Math.min(logs.reduce((sum, l) => sum + l.value, 0), totalTarget);
    todayLogged = totalLogged;
  }

  res.json({
    totalLogged,
    totalTarget,
    todayLogged,
    todayTarget: challenge.targetValue,
    streak,
    ...(days ? { days } : {}),
  });
});

router.get("/challenges/:id/leaderboard", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const challengeId = getParam(req.params, "id");

  const participation = await requireParticipant(req.user.id, challengeId);
  if (!participation) {
    res.status(403).json({ error: "Not a participant" });
    return;
  }

  const [challenge] = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.id, challengeId));

  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const leaderboard = await buildLeaderboard(challenge);
  res.json(leaderboard);
});

async function buildLeaderboard(challenge: typeof challengesTable.$inferSelect) {
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

  const state = getChallengeState(challenge.startDate, challenge.durationDays);

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

      const totalTarget = challenge.type === "daily"
        ? challenge.targetValue * challenge.durationDays
        : challenge.targetValue;

      let totalLogged: number;
      let streak = 0;

      if (challenge.type === "daily" && state !== "not_started") {
        const dayProgress = computeDailyProgress(logs, challenge.startDate, challenge.durationDays, challenge.targetValue);
        totalLogged = dayProgress.reduce((sum, d) => sum + d.logged, 0);
        streak = computeStreak(dayProgress, challenge.startDate);
      } else {
        totalLogged = Math.min(logs.reduce((sum, l) => sum + l.value, 0), totalTarget);
      }

      const percentComplete = totalTarget > 0 ? Math.round((totalLogged / totalTarget) * 10000) / 100 : 0;

      const userName = [p.firstName, p.lastName].filter(Boolean).join(" ") || "User";

      return {
        userId: p.userId,
        userName,
        profileImageUrl: p.profileImageUrl,
        totalLogged,
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
