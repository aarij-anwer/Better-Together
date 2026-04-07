import app from "./app";
import { logger } from "./lib/logger";
import { runNotifications } from "./lib/notifications";
import cron from "node-cron";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  cron.schedule("0 9 * * *", async () => {
    logger.info("Running scheduled notification job");
    try {
      const summary = await runNotifications();
      logger.info(summary, "Scheduled notification job complete");
    } catch (err) {
      logger.error({ err }, "Scheduled notification job failed");
    }
  }, { timezone: "UTC" });

  logger.info("Notification cron job scheduled (daily at 09:00 UTC)");
});
