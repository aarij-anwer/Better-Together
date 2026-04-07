import { eq } from "drizzle-orm";
import { db, usersTable, challengesTable, participationsTable, progressLogsTable } from "@workspace/db";
import { generateDailyTargets } from "@workspace/shared";
import { generateInviteCode } from "./challengeUtils";
import { logger } from "./logger";

const DEMO_SLUG = "demo-pushup-challenge";

const DUMMY_USERS = [
  { firstName: "Alex", lastName: "K." },
  { firstName: "Jamie", lastName: "L." },
  { firstName: "Morgan", lastName: "R." },
  { firstName: "Sam", lastName: "T." },
];

export async function seedDemoChallenge(): Promise<void> {
  const [existing] = await db
    .select({ id: challengesTable.id })
    .from(challengesTable)
    .where(eq(challengesTable.slug, DEMO_SLUG))
    .limit(1);

  if (existing) {
    logger.info("Demo pushup challenge already exists, skipping seed");
    return;
  }

  const systemUserId = crypto.randomUUID();
  await db.insert(usersTable).values({
    id: systemUserId,
    firstName: "System",
    lastName: "Bot",
    isAnonymous: true,
  });

  const now = new Date();
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const dailyTargets = generateDailyTargets({
    baseTarget: 30,
    durationDays: 10,
    restDayEnabled: true,
    randomizeReps: true,
  });

  let inviteCode = generateInviteCode();
  for (let i = 0; i < 5; i++) {
    const [dup] = await db
      .select({ id: challengesTable.id })
      .from(challengesTable)
      .where(eq(challengesTable.inviteCode, inviteCode));
    if (!dup) break;
    inviteCode = generateInviteCode();
  }

  const [challenge] = await db
    .insert(challengesTable)
    .values({
      title: "10-Day Pushup Challenge",
      slug: DEMO_SLUG,
      activityType: "pushups",
      unit: "reps",
      type: "daily",
      targetValue: 30,
      durationDays: 10,
      startDate,
      createdById: systemUserId,
      inviteCode,
      dailyTargets,
      randomizeReps: true,
      restDayEnabled: true,
      isPublic: true,
      noMax: true,
    })
    .returning();

  const userIds: string[] = [];
  for (const u of DUMMY_USERS) {
    const userId = crypto.randomUUID();
    await db.insert(usersTable).values({
      id: userId,
      firstName: u.firstName,
      lastName: u.lastName,
      isAnonymous: true,
    });
    await db.insert(participationsTable).values({
      userId,
      challengeId: challenge.id,
    });
    userIds.push(userId);
  }

  const progressAmounts = [
    [28, 25, 15],
    [22, 30],
    [18, 20, 10],
    [15],
  ];

  for (let i = 0; i < userIds.length; i++) {
    const amounts = progressAmounts[i] ?? [10];
    for (let dayIdx = 0; dayIdx < amounts.length; dayIdx++) {
      const logDate = new Date(startDate);
      logDate.setUTCDate(logDate.getUTCDate() + dayIdx);
      logDate.setUTCHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
      await db.insert(progressLogsTable).values({
        userId: userIds[i],
        challengeId: challenge.id,
        date: logDate,
        value: amounts[dayIdx],
      });
    }
  }

  logger.info({ challengeId: challenge.id, slug: DEMO_SLUG }, "Demo pushup challenge seeded with dummy users");
}
