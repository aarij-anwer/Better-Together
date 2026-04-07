import { db, challengesTable, participationsTable, progressLogsTable, usersTable, notificationLogsTable } from "@workspace/db";
import { eq, and, count, inArray } from "drizzle-orm";
import { getChallengeState } from "./challengeUtils";
import { sendEmail, getAppUrl, isEmailEnabled } from "./email";
import {
  challengeStartedTemplate,
  notParticipatedReminderTemplate,
  challengeEndedTemplate,
} from "./emailTemplates";
import { logger } from "./logger";

export interface NotificationSummary {
  challengeStarted: number;
  notParticipatedReminder: number;
  challengeEnded: number;
  skippedNoEmail: number;
  errors: number;
}

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function toUTCDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getReminderDays(durationDays: number): number[] {
  if (durationDays <= 3) return [1];
  if (durationDays <= 6) return [1, durationDays - 2];
  return [3, Math.floor(durationDays / 2), durationDays - 3];
}

export async function runNotifications(): Promise<NotificationSummary> {
  const summary: NotificationSummary = {
    challengeStarted: 0,
    notParticipatedReminder: 0,
    challengeEnded: 0,
    skippedNoEmail: 0,
    errors: 0,
  };

  if (!isEmailEnabled()) {
    logger.warn("RESEND_API_KEY is not set — skipping notification run");
    return summary;
  }

  const todayUTC = startOfDayUTC(new Date());
  const todayStr = toUTCDateString(todayUTC);
  const appUrl = getAppUrl();

  const challenges = await db.select().from(challengesTable);

  for (const challenge of challenges) {
    const startDate = startOfDayUTC(challenge.startDate);
    const startStr = toUTCDateString(startDate);

    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + challenge.durationDays);
    const endStr = toUTCDateString(endDate);

    const state = getChallengeState(challenge.startDate, challenge.durationDays, todayUTC);

    const isStartDay = todayStr === startStr;
    const isLastDay = todayStr === toUTCDateString(new Date(endDate.getTime() - 86400_000));
    const isActive = state === "active";

    if (!isStartDay && !isLastDay && !isActive) continue;

    const participations = await db
      .select({ userId: participationsTable.userId })
      .from(participationsTable)
      .where(eq(participationsTable.challengeId, challenge.id));

    if (participations.length === 0) continue;

    const userIds = participations.map((p) => p.userId);

    const users = await db
      .select({ id: usersTable.id, email: usersTable.email, firstName: usersTable.firstName })
      .from(usersTable)
      .where(inArray(usersTable.id, userIds));

    const userMap = new Map(users.map((u) => [u.id, u]));

    const challengeUrl = `${appUrl}/challenge/${challenge.slug ?? challenge.id}`;

    for (const { userId } of participations) {
      const user = userMap.get(userId);
      if (!user) continue;

      if (!user.email) {
        summary.skippedNoEmail++;
        continue;
      }

      if (isStartDay) {
        const [existing] = await db
          .select()
          .from(notificationLogsTable)
          .where(
            and(
              eq(notificationLogsTable.userId, userId),
              eq(notificationLogsTable.challengeId, challenge.id),
              eq(notificationLogsTable.type, "challenge_started"),
            ),
          );

        if (!existing) {
          const { subject, html } = challengeStartedTemplate({
            firstName: user.firstName,
            challengeTitle: challenge.title,
            challengeUrl,
            activityType: challenge.activityType,
            durationDays: challenge.durationDays,
          });

          const sent = await sendEmail(user.email, subject, html);
          if (sent) {
            await db.insert(notificationLogsTable).values({
              userId,
              challengeId: challenge.id,
              type: "challenge_started",
              reminderNumber: null,
            }).onConflictDoNothing();
            summary.challengeStarted++;
          } else {
            summary.errors++;
          }
        }
      }

      if (isLastDay) {
        const [existing] = await db
          .select()
          .from(notificationLogsTable)
          .where(
            and(
              eq(notificationLogsTable.userId, userId),
              eq(notificationLogsTable.challengeId, challenge.id),
              eq(notificationLogsTable.type, "challenge_ended"),
            ),
          );

        if (!existing) {
          const { subject, html } = challengeEndedTemplate({
            firstName: user.firstName,
            challengeTitle: challenge.title,
            challengeUrl,
            durationDays: challenge.durationDays,
          });

          const sent = await sendEmail(user.email, subject, html);
          if (sent) {
            await db.insert(notificationLogsTable).values({
              userId,
              challengeId: challenge.id,
              type: "challenge_ended",
              reminderNumber: null,
            }).onConflictDoNothing();
            summary.challengeEnded++;
          } else {
            summary.errors++;
          }
        }
      }

      if (isActive) {
        const [{ value: logCount }] = await db
          .select({ value: count() })
          .from(progressLogsTable)
          .where(
            and(
              eq(progressLogsTable.userId, userId),
              eq(progressLogsTable.challengeId, challenge.id),
            ),
          );

        if (logCount > 0) continue;

        const dayIndex = Math.floor(
          (todayUTC.getTime() - startDate.getTime()) / 86400_000,
        );
        const daysLeft = challenge.durationDays - dayIndex;

        const reminderDays = getReminderDays(challenge.durationDays);
        const reminderDayIndex = reminderDays.findIndex((d) => d === dayIndex);
        if (reminderDayIndex === -1) continue;

        const reminderNumber = reminderDayIndex + 1;

        const [existing] = await db
          .select()
          .from(notificationLogsTable)
          .where(
            and(
              eq(notificationLogsTable.userId, userId),
              eq(notificationLogsTable.challengeId, challenge.id),
              eq(notificationLogsTable.type, "not_participated_reminder"),
              eq(notificationLogsTable.reminderNumber, reminderNumber),
            ),
          );

        if (!existing) {
          const { subject, html } = notParticipatedReminderTemplate({
            firstName: user.firstName,
            challengeTitle: challenge.title,
            challengeUrl,
            reminderNumber,
            daysElapsed: dayIndex,
            daysLeft,
          });

          const sent = await sendEmail(user.email, subject, html);
          if (sent) {
            await db.insert(notificationLogsTable).values({
              userId,
              challengeId: challenge.id,
              type: "not_participated_reminder",
              reminderNumber,
            }).onConflictDoNothing();
            summary.notParticipatedReminder++;
          } else {
            summary.errors++;
          }
        }
      }
    }
  }

  logger.info(summary, "Notification run complete");
  return summary;
}
