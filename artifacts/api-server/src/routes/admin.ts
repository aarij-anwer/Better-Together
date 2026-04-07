import { Router, type IRouter, type Request, type Response } from "express";
import { asc } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { runNotifications } from "../lib/notifications";
import { isEmailEnabled } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function getFirstUserId(): Promise<string | null> {
  const [first] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .orderBy(asc(usersTable.createdAt))
    .limit(1);
  return first?.id ?? null;
}

router.post("/admin/notifications/run", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const currentUserId = req.user?.id;
  const firstUserId = await getFirstUserId();
  if (!currentUserId || currentUserId !== firstUserId) {
    res.status(403).json({ error: "Forbidden — only the app owner can trigger notifications." });
    return;
  }

  if (!await isEmailEnabled()) {
    res.status(503).json({
      error: "Email not configured",
      message: "Connect the Resend integration to enable email notifications.",
    });
    return;
  }

  try {
    logger.info({ triggeredBy: currentUserId }, "Manual notification run triggered");
    const summary = await runNotifications();
    res.json({ ok: true, summary });
  } catch (err) {
    logger.error({ err }, "Manual notification run failed");
    res.status(500).json({ error: "Notification run failed", details: String(err) });
  }
});

export default router;
