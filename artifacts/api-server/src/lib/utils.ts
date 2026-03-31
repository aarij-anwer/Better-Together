import { computeDailyProgress } from "./challengeUtils";

export interface ChallengeProgressInput {
  logs: Array<{ date: Date; value: number }>;
  startDate: Date;
  durationDays: number;
  targetValue: number;
  type: "daily" | "total";
}

export interface ChallengeProgressResult {
  totalLogged: number;
  totalTarget: number;
  todayLogged: number;
  todayTarget: number;
  days?: ReturnType<typeof computeDailyProgress>;
}

export function computeChallengeProgress(input: ChallengeProgressInput): ChallengeProgressResult {
  const { logs, startDate, durationDays, targetValue, type } = input;

  const totalTarget = type === "daily" ? targetValue * durationDays : targetValue;

  if (type === "daily") {
    const dayProgress = computeDailyProgress(logs, startDate, durationDays, targetValue);
    const totalLogged = dayProgress.reduce((sum, d) => sum + d.logged, 0);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todayDay = dayProgress.find((d) => d.date === todayStr);
    const todayLogged = todayDay?.logged ?? 0;

    return {
      totalLogged,
      totalTarget,
      todayLogged,
      todayTarget: targetValue,
      days: dayProgress,
    };
  }

  const rawSum = logs.reduce((sum, l) => sum + l.value, 0);
  const totalLogged = Math.min(rawSum, totalTarget);

  return {
    totalLogged,
    totalTarget,
    todayLogged: totalLogged,
    todayTarget: targetValue,
  };
}
