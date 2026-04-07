import { Router, type IRouter, type Request, type Response } from "express";
import { runNotifications } from "../lib/notifications";
import { isEmailEnabled } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/admin/notifications/run", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
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
    logger.info({ triggeredBy: req.user?.id }, "Manual notification run triggered");
    const summary = await runNotifications();
    res.json({ ok: true, summary });
  } catch (err) {
    logger.error({ err }, "Manual notification run failed");
    res.status(500).json({ error: "Notification run failed", details: String(err) });
  }
});

export default router;
