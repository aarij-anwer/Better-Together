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

export function getChallengeState(startDate: Date, durationDays: number): "not_started" | "active" | "completed" {
  const today = startOfDay(new Date());
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
  targetValue: number
): DayProgressItem[] {
  const start = startOfDay(startDate);

  const days: DayProgressItem[] = [];
  for (let i = 0; i < durationDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push({
      date: toDateString(d),
      logged: 0,
      target: targetValue,
      completed: false,
    });
  }

  const dayMap = new Map<string, number>();
  for (const day of days) {
    dayMap.set(day.date, days.indexOf(day));
  }

  for (const log of logs) {
    const logDate = toDateString(log.date);
    const idx = dayMap.get(logDate);
    if (idx !== undefined) {
      days[idx].logged += log.value;
    }
  }

  const today = toDateString(new Date());
  const todayIdx = dayMap.get(today);

  if (todayIdx !== undefined) {
    let overflow = Math.max(0, days[todayIdx].logged - targetValue);
    if (overflow > 0) {
      days[todayIdx].logged = targetValue;

      for (let i = 0; i < durationDays && overflow > 0; i++) {
        if (i === todayIdx) continue;
        const canFill = Math.max(0, targetValue - days[i].logged);
        if (canFill > 0) {
          const fill = Math.min(overflow, canFill);
          days[i].logged += fill;
          overflow -= fill;
        }
      }
    }
  }

  for (const day of days) {
    day.logged = Math.min(day.logged, targetValue);
    day.completed = day.logged >= day.target;
  }

  return days;
}

export function computeStreak(days: DayProgressItem[], startDate: Date): number {
  const today = toDateString(new Date());
  const start = startOfDay(startDate);
  const todayDate = startOfDay(new Date());
  const todayIdx = Math.floor((todayDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  let streak = 0;
  let checkIdx = todayIdx;

  if (checkIdx < 0 || checkIdx >= days.length) return 0;

  if (!days[checkIdx].completed) {
    checkIdx--;
  }

  while (checkIdx >= 0 && days[checkIdx].completed) {
    streak++;
    checkIdx--;
  }

  return streak;
}
