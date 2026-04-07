import { pgTable, text, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { challengesTable } from "./challenges";

export const NOTIFICATION_TYPES = [
  "challenge_started",
  "not_participated_reminder",
  "challenge_ended",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const notificationLogsTable = pgTable(
  "notification_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => usersTable.id),
    challengeId: text("challenge_id").notNull().references(() => challengesTable.id),
    type: text("type").$type<NotificationType>().notNull(),
    reminderNumber: integer("reminder_number"),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("notification_unique").on(
      table.userId,
      table.challengeId,
      table.type,
      table.reminderNumber,
    ),
  ],
);

export type NotificationLog = typeof notificationLogsTable.$inferSelect;
export type InsertNotificationLog = typeof notificationLogsTable.$inferInsert;
