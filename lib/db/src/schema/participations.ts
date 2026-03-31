import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";
import { challengesTable } from "./challenges";

export const participationsTable = pgTable("participations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id),
  challengeId: text("challenge_id").notNull().references(() => challengesTable.id),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("user_challenge_unique").on(table.userId, table.challengeId),
]);

export const insertParticipationSchema = createInsertSchema(participationsTable).omit({ id: true, joinedAt: true });
export type InsertParticipation = z.infer<typeof insertParticipationSchema>;
export type Participation = typeof participationsTable.$inferSelect;
