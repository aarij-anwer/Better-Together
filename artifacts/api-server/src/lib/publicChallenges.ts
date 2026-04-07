import { asc, desc, eq, and, gt } from "drizzle-orm";
import { db, usersTable, challengesTable } from "@workspace/db";
import { generateDailyTargets } from "@workspace/shared";
import { generateSlug, generateInviteCode, getUnitForActivity } from "./challengeUtils";
import { logger } from "./logger";

const ROTATION = [
  { activityType: "pushups", targetValue: 30, title: "10-Day Pushup Challenge" },
  { activityType: "pullups", targetValue: 6,  title: "10-Day Pullup Challenge" },
  { activityType: "squats",  targetValue: 50, title: "10-Day Squat Challenge"  },
] as const;

const DURATION_DAYS = 10;
const DAYS_AHEAD = 3;

export interface SeedResult {
  created: boolean;
  reason?: string;
  challenge?: { id: string; slug: string; title: string; startDate: string };
}

export async function seedPublicChallenge(): Promise<SeedResult> {
  const [firstUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .orderBy(asc(usersTable.createdAt))
    .limit(1);

  if (!firstUser) {
    return { created: false, reason: "No users registered yet" };
  }

  // Determine next activity in rotation based on the most recent public challenge
  const [lastPublic] = await db
    .select({ activityType: challengesTable.activityType })
    .from(challengesTable)
    .where(eq(challengesTable.isPublic, true))
    .orderBy(desc(challengesTable.startDate))
    .limit(1);

  const lastIndex = lastPublic
    ? ROTATION.findIndex((r) => r.activityType === lastPublic.activityType)
    : -1;
  const nextIndex = (lastIndex + 1) % ROTATION.length;
  const activity = ROTATION[nextIndex];

  // Idempotency: skip if an upcoming public challenge for this specific activity already exists
  const now = new Date();
  const [existing] = await db
    .select({ id: challengesTable.id })
    .from(challengesTable)
    .where(
      and(
        eq(challengesTable.isPublic, true),
        eq(challengesTable.activityType, activity.activityType),
        gt(challengesTable.startDate, now),
      ),
    )
    .limit(1);

  if (existing) {
    return {
      created: false,
      reason: `Upcoming public ${activity.activityType} challenge already exists`,
    };
  }

  // Start date: DAYS_AHEAD days from today, midnight UTC
  const startDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + DAYS_AHEAD,
  ));

  const dailyTargets = generateDailyTargets({
    baseTarget: activity.targetValue,
    durationDays: DURATION_DAYS,
    restDayEnabled: true,
    randomizeReps: true,
  });

  // Unique invite code
  let inviteCode = generateInviteCode();
  for (let i = 0; i < 5; i++) {
    const [dup] = await db
      .select({ id: challengesTable.id })
      .from(challengesTable)
      .where(eq(challengesTable.inviteCode, inviteCode));
    if (!dup) break;
    inviteCode = generateInviteCode();
  }

  // Unique slug
  const baseSlug = generateSlug(activity.title);
  let slug = baseSlug;
  for (let i = 0; i < 10; i++) {
    const [dup] = await db
      .select({ id: challengesTable.id })
      .from(challengesTable)
      .where(eq(challengesTable.slug, slug));
    if (!dup) break;
    slug = `${baseSlug}-${Math.floor(Math.random() * 9999)}`;
  }

  const [challenge] = await db
    .insert(challengesTable)
    .values({
      title: activity.title,
      slug,
      activityType: activity.activityType,
      unit: getUnitForActivity(activity.activityType),
      type: "daily",
      targetValue: activity.targetValue,
      durationDays: DURATION_DAYS,
      startDate,
      createdById: firstUser.id,
      inviteCode,
      dailyTargets,
      randomizeReps: true,
      restDayEnabled: true,
      isPublic: true,
      noMax: false,
    })
    .returning();

  logger.info(
    { challengeId: challenge.id, slug: challenge.slug, activity: activity.activityType, startDate },
    "Auto-created public challenge",
  );

  return {
    created: true,
    challenge: {
      id: challenge.id,
      slug: challenge.slug,
      title: challenge.title,
      startDate: challenge.startDate.toISOString(),
    },
  };
}
