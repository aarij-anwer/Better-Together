import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const challengesTable = pgTable("challenges", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  activityType: text("activity_type").notNull(),
  unit: text("unit").notNull(),
  type: text("type").notNull(),
  targetValue: integer("target_value").notNull(),
  durationDays: integer("duration_days").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  createdById: text("created_by_id").notNull().references(() => usersTable.id),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChallengeSchema = createInsertSchema(challengesTable).omit({ id: true, createdAt: true });
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challengesTable.$inferSelect;
