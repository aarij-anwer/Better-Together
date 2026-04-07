const CORAL = "#F4645F";
const DARK = "#1a1a2e";
const LIGHT_BG = "#fdf8f6";
const GRAY = "#6b7280";

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Get Better Together</title>
</head>
<body style="margin:0;padding:0;background-color:${LIGHT_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${LIGHT_BG};padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background-color:${CORAL};border-radius:10px;display:inline-block;vertical-align:middle;text-align:center;line-height:36px;">
                  <span style="color:white;font-size:18px;font-weight:bold;">&#9889;</span>
                </div>
                <span style="font-size:18px;font-weight:700;color:${DARK};vertical-align:middle;margin-left:10px;">Get Better Together</span>
              </div>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:white;border-radius:16px;padding:36px 32px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:${GRAY};">You received this because you're part of a challenge on Get Better Together.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background-color:${CORAL};color:white;font-size:15px;font-weight:600;padding:14px 28px;border-radius:10px;text-decoration:none;margin-top:20px;">${label}</a>`;
}

function greeting(firstName: string | null): string {
  return firstName ? `Hey ${firstName},` : "Hey there,";
}

export function challengeStartedTemplate(params: {
  firstName: string | null;
  challengeTitle: string;
  challengeUrl: string;
  durationDays: number;
}): { subject: string; html: string } {
  const subject = `Your "${params.challengeTitle}" challenge has started!`;
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${DARK};">It's go time! &#127942;</h2>
    <p style="margin:0 0 20px;font-size:15px;color:${GRAY};line-height:1.6;">${greeting(params.firstName)}</p>
    <p style="margin:0 0 20px;font-size:15px;color:${DARK};line-height:1.6;">
      Your <strong>${params.challengeTitle}</strong> challenge has officially kicked off today! 
      You've got <strong>${params.durationDays} days</strong> to push your limits and outperform your crew.
    </p>
    <p style="margin:0 0 4px;font-size:15px;color:${DARK};line-height:1.6;">
      Today is day 1 — make it count.
    </p>
    <div style="text-align:center;margin-top:8px;">
      ${ctaButton(params.challengeUrl, "Log your first entry →")}
    </div>
  `);
  return { subject, html };
}

export function notParticipatedReminderTemplate(params: {
  firstName: string | null;
  challengeTitle: string;
  challengeUrl: string;
  reminderNumber: number;
  daysElapsed: number;
  daysLeft: number;
}): { subject: string; html: string } {
  const urgencyMap: Record<number, { emoji: string; headline: string; body: string }> = {
    1: {
      emoji: "&#128293;",
      headline: "Don't fall behind!",
      body: `You haven't logged anything in <strong>${params.challengeTitle}</strong> yet. The challenge is already underway — your team is counting on you.`,
    },
    2: {
      emoji: "&#9201;",
      headline: "Still time to catch up!",
      body: `You're at the halfway mark in <strong>${params.challengeTitle}</strong> and haven't logged anything yet. Jump in now — progress backfills automatically as you log.`,
    },
    3: {
      emoji: "&#128680;",
      headline: "Final chance!",
      body: `Only <strong>${params.daysLeft} days left</strong> in <strong>${params.challengeTitle}</strong> and you haven't participated yet. This is your last reminder — make it count!`,
    },
  };
  const tone = urgencyMap[params.reminderNumber] ?? urgencyMap[1];
  const subject = `Reminder: you haven't logged anything in "${params.challengeTitle}"`;
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${DARK};">${tone.headline} ${tone.emoji}</h2>
    <p style="margin:0 0 20px;font-size:15px;color:${GRAY};line-height:1.6;">${greeting(params.firstName)}</p>
    <p style="margin:0 0 20px;font-size:15px;color:${DARK};line-height:1.6;">${tone.body}</p>
    <div style="text-align:center;margin-top:8px;">
      ${ctaButton(params.challengeUrl, "Log your progress →")}
    </div>
  `);
  return { subject, html };
}

export function welcomeTemplate(params: {
  firstName: string | null;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const subject = "Welcome to Get Better Together!";
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${DARK};">Welcome aboard! &#127881;</h2>
    <p style="margin:0 0 20px;font-size:15px;color:${GRAY};line-height:1.6;">${greeting(params.firstName)}</p>
    <p style="margin:0 0 20px;font-size:15px;color:${DARK};line-height:1.6;">
      You're officially part of <strong>Get Better Together</strong> — the place where friends push each other to build better habits, crush goals, and have fun doing it.
    </p>
    <p style="margin:0 0 4px;font-size:15px;color:${DARK};line-height:1.6;">
      Ready to get started? Create your first challenge or join one with friends &#128170;
    </p>
    <div style="text-align:center;margin-top:8px;">
      ${ctaButton(params.dashboardUrl, "Go to your dashboard →")}
    </div>
  `);
  return { subject, html };
}

export function challengeJoinedTemplate(params: {
  firstName: string | null;
  challengeTitle: string;
  challengeUrl: string;
  durationDays: number;
}): { subject: string; html: string } {
  const subject = `You've joined "${params.challengeTitle}" — let's go!`;
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${DARK};">You're in! &#128170;</h2>
    <p style="margin:0 0 20px;font-size:15px;color:${GRAY};line-height:1.6;">${greeting(params.firstName)}</p>
    <p style="margin:0 0 20px;font-size:15px;color:${DARK};line-height:1.6;">
      You've successfully joined the <strong>${params.challengeTitle}</strong> challenge!
      This is a <strong>${params.durationDays}-day</strong> challenge — time to show up and compete with your crew.
    </p>
    <p style="margin:0 0 4px;font-size:15px;color:${DARK};line-height:1.6;">
      Head over to the challenge page to start logging your progress.
    </p>
    <div style="text-align:center;margin-top:8px;">
      ${ctaButton(params.challengeUrl, "View your challenge →")}
    </div>
  `);
  return { subject, html };
}

export function challengeEndedTemplate(params: {
  firstName: string | null;
  challengeTitle: string;
  challengeUrl: string;
  durationDays: number;
}): { subject: string; html: string } {
  const subject = `"${params.challengeTitle}" has ended — see how you did!`;
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${DARK};">Challenge complete! &#127881;</h2>
    <p style="margin:0 0 20px;font-size:15px;color:${GRAY};line-height:1.6;">${greeting(params.firstName)}</p>
    <p style="margin:0 0 20px;font-size:15px;color:${DARK};line-height:1.6;">
      The <strong>${params.challengeTitle}</strong> challenge has officially wrapped up after <strong>${params.durationDays} days</strong>.
      Head over to the leaderboard to see where you landed!
    </p>
    <p style="margin:0 0 4px;font-size:15px;color:${DARK};line-height:1.6;">
      Great work showing up. See you in the next one. Feel free to create a challenge and invite friends &#128170;
    </p>
    <div style="text-align:center;margin-top:8px;">
      ${ctaButton(params.challengeUrl, "View final leaderboard →")}
    </div>
  `);
  return { subject, html };
}
