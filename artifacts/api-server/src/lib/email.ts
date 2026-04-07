import { Resend } from "resend";
import { logger } from "./logger";

async function getCredentials(): Promise<{ apiKey: string; fromEmail: string }> {
  const hostname = process.env["REPLIT_CONNECTORS_HOSTNAME"];
  const xReplitToken = process.env["REPL_IDENTITY"]
    ? "repl " + process.env["REPL_IDENTITY"]
    : process.env["WEB_REPL_RENEWAL"]
    ? "depl " + process.env["WEB_REPL_RENEWAL"]
    : null;

  if (hostname && xReplitToken) {
    const data = await fetch(
      "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
      {
        headers: {
          Accept: "application/json",
          "X-Replit-Token": xReplitToken,
        },
      },
    ).then((res) => res.json()).then((d: any) => d.items?.[0]);

    if (data?.settings?.api_key) {
      return {
        apiKey: data.settings.api_key,
        fromEmail: data.settings.from_email ?? "Get Better Together <onboarding@resend.dev>",
      };
    }
  }

  const envKey = process.env["RESEND_API_KEY"];
  if (envKey) {
    return {
      apiKey: envKey,
      fromEmail: process.env["RESEND_FROM_EMAIL"] ?? "Get Better Together <onboarding@resend.dev>",
    };
  }

  throw new Error("Resend not connected — set up the Resend integration or provide RESEND_API_KEY.");
}

export function getAppUrl(): string {
  if (process.env["APP_URL"]) return process.env["APP_URL"];
  if (process.env["REPLIT_DEV_DOMAIN"]) return `https://${process.env["REPLIT_DEV_DOMAIN"]}`;
  return "https://getbettertogether.app";
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const { apiKey, fromEmail } = await getCredentials();
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from: fromEmail, to, subject, html });
    if (error) {
      logger.error({ error, to, subject }, "Resend returned an error");
      return false;
    }
    logger.info({ to, subject }, "Email sent successfully");
    return true;
  } catch (err) {
    logger.error({ err, to, subject }, "Failed to send email");
    return false;
  }
}

export async function isEmailEnabled(): Promise<boolean> {
  try {
    await getCredentials();
    return true;
  } catch {
    return false;
  }
}
