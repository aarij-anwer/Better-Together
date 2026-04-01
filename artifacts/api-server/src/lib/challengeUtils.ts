const ACTIVITY_UNITS: Record<string, string> = {
  pushups: "reps",
  situps: "reps",
  squats: "reps",
  pullups: "reps",
  burpees: "reps",
  running: "km",
  walking: "km",
  cycling: "km",
  swimming: "laps",
  steps: "steps",
  meditation: "minutes",
  reading: "pages",
  water: "glasses",
  custom: "units",
};

export function getUnitForActivity(activityType: string): string {
  return ACTIVITY_UNITS[activityType] || "units";
}

export function generateSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
  if (!slug) {
    return `challenge-${crypto.randomUUID().substring(0, 8)}`;
  }
  return slug;
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getClientNow(timezoneOffsetHeader?: string | null): Date {
  const now = new Date();
  if (timezoneOffsetHeader == null) return now;
  const clientOffset = parseInt(timezoneOffsetHeader, 10);
  if (isNaN(clientOffset)) return now;
  const serverOffset = now.getTimezoneOffset();
  const diffMs = (serverOffset - clientOffset) * 60 * 1000;
  return new Date(now.getTime() + diffMs);
}

export function getChallengeState(startDate: Date, durationDays: number, clientNow?: Date): "not_started" | "active" | "completed" {
  const today = startOfDay(clientNow ?? new Date());
  const start = startOfDay(startDate);
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + durationDays);

  if (today < start) return "not_started";
  if (today >= endDate) return "completed";
  return "active";
}

export interface DayProgressItem {
  date: string;
  logged: number;
  target: number;
  completed: boolean;
}

export function computeDailyProgress(
  logs: Array<{ date: Date; value: number }>,
  startDate: Date,
  durationDays: number,
  targetValue: number,
  dailyTargets?: number[] | null
): DayProgressItem[] {
  const start = startOfDay(startDate);

  const days: DayProgressItem[] = [];
  for (let i = 0; i < durationDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dayTarget = dailyTargets ? dailyTargets[i] : targetValue;
    days.push({
      date: toDateString(d),
      logged: 0,
      target: dayTarget,
      completed: dayTarget === 0,
    });
  }

  const dayMap = new Map<string, number>();
  for (let i = 0; i < days.length; i++) {
    dayMap.set(days[i].date, i);
  }

  const sortedLogs = [...logs].sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const log of sortedLogs) {
    let remaining = log.value;
    const logDate = toDateString(log.date);
    const primaryIdx = dayMap.get(logDate);

    if (primaryIdx !== undefined && days[primaryIdx].target > 0) {
      const dayCap = days[primaryIdx].target;
      const canFill = Math.max(0, dayCap - days[primaryIdx].logged);
      const fill = Math.min(remaining, canFill);
      days[primaryIdx].logged += fill;
      remaining -= fill;
    }

    if (remaining > 0) {
      const logDayBound = logDate;
      for (let i = 0; i < durationDays; i++) {
        if (days[i].date > logDayBound) break;
        if (days[i].target === 0) continue;
        const dayCap = days[i].target;
        const canFill = Math.max(0, dayCap - days[i].logged);
        if (canFill > 0) {
          const fill = Math.min(remaining, canFill);
          days[i].logged += fill;
          remaining -= fill;
          if (remaining <= 0) break;
        }
      }
    }
  }

  for (const day of days) {
    day.logged = Math.min(day.logged, day.target);
    day.completed = day.logged >= day.target;
  }

  return days;
}

export function computeAllocatedTotal(
  logs: Array<{ date: Date; value: number }>,
  startDate: Date,
  durationDays: number,
  targetValue: number,
  dailyTargets?: number[] | null
): number {
  const days = computeDailyProgress(logs, startDate, durationDays, targetValue, dailyTargets);
  return days.reduce((sum, d) => sum + d.logged, 0);
}

export function computeStreak(days: DayProgressItem[], startDate: Date, clientNow?: Date): number {
  const start = startOfDay(startDate);
  const todayDate = startOfDay(clientNow ?? new Date());
  const todayIdx = Math.floor((todayDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  let checkIdx = todayIdx;

  if (checkIdx < 0) return 0;

  if (checkIdx >= days.length) {
    checkIdx = days.length - 1;
  }

  if (!days[checkIdx].completed) {
    checkIdx--;
  }

  let streak = 0;
  while (checkIdx >= 0 && days[checkIdx].completed) {
    streak++;
    checkIdx--;
  }

  return streak;
}
