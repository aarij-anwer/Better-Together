import { computeDailyProgress } from "./challengeUtils";

export function getCurrentDay(startDate: Date, durationDays: number, clientNow?: Date): number {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const now = clientNow ?? new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = today.getTime() - start.getTime();
  const rawDay = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(rawDay, durationDays));
}

export interface ChallengeProgressInput {
  logs: Array<{ date: Date; value: number }>;
  startDate: Date;
  durationDays: number;
  targetValue: number;
  type: "daily" | "total";
  dailyTargets?: number[] | null;
  clientNow?: Date;
}

export interface ChallengeProgressResult {
  totalLogged: number;
  totalTarget: number;
  todayLogged: number;
  todayTarget: number;
  days?: ReturnType<typeof computeDailyProgress>;
}

export function computeChallengeProgress(input: ChallengeProgressInput): ChallengeProgressResult {
  const { logs, startDate, durationDays, targetValue, type, dailyTargets, clientNow } = input;

  if (type === "daily") {
    const dayProgress = computeDailyProgress(logs, startDate, durationDays, targetValue, dailyTargets);
    const totalLogged = dayProgress.reduce((sum, d) => sum + d.logged, 0);
    const totalTarget = dayProgress.reduce((sum, d) => sum + d.target, 0);
    const now = clientNow ?? new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todayDay = dayProgress.find((d) => d.date === todayStr);
    const todayLogged = todayDay?.logged ?? 0;
    const todayTarget = todayDay?.target ?? targetValue;

    return {
      totalLogged,
      totalTarget,
      todayLogged,
      todayTarget,
      days: dayProgress,
    };
  }

  const totalTarget = targetValue;
  const rawSum = logs.reduce((sum, l) => sum + l.value, 0);
  const totalLogged = Math.min(rawSum, totalTarget);

  return {
    totalLogged,
    totalTarget,
    todayLogged: totalLogged,
    todayTarget: targetValue,
  };
}
