import { Resend } from "resend";
import { logger } from "./logger";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env["RESEND_API_KEY"];
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set. Configure the Resend integration to send emails.");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export function getAppUrl(): string {
  if (process.env["APP_URL"]) return process.env["APP_URL"];
  if (process.env["REPLIT_DEV_DOMAIN"]) return `https://${process.env["REPLIT_DEV_DOMAIN"]}`;
  return "https://getbettertogether.app";
}

export function getFromEmail(): string {
  return process.env["RESEND_FROM_EMAIL"] ?? "Get Better Together <noreply@getbettertogether.app>";
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const from = getFromEmail();
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({ from, to, subject, html });
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

export function isEmailEnabled(): boolean {
  return Boolean(process.env["RESEND_API_KEY"]);
}
