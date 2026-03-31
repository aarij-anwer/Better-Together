export interface GenerateDailyTargetsOptions {
  baseTarget: number;
  durationDays: number;
  restDayEnabled: boolean;
  randomizeReps: boolean;
  seed?: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

const WAVE_PATTERN = [0.6, 0.8, 1.0, 1.2, 1.4, 1.1, 0.9];

export function generateDailyTargets(
  options: GenerateDailyTargetsOptions
): number[] | null {
  const { baseTarget, durationDays, restDayEnabled, randomizeReps, seed } =
    options;

  if (!restDayEnabled && !randomizeReps) {
    return null;
  }

  const random = seed !== undefined ? seededRandom(seed) : Math.random;
  const targets: number[] = [];
  const minTarget = Math.round(baseTarget * 0.4);
  const maxTarget = Math.round(baseTarget * 1.6);

  const restDays = new Set<number>();
  if (restDayEnabled) {
    for (let i = 0; i < durationDays; i++) {
      if ((i + 1) % 7 === 0) {
        restDays.add(i);
      }
    }
  }

  for (let i = 0; i < durationDays; i++) {
    if (restDays.has(i)) {
      targets.push(0);
      continue;
    }

    if (randomizeReps) {
      const waveMultiplier = WAVE_PATTERN[i % WAVE_PATTERN.length];
      const noise = 1 + (random() * 0.2 - 0.1);
      const rawTarget = Math.round(baseTarget * waveMultiplier * noise);
      targets.push(Math.max(minTarget, Math.min(rawTarget, maxTarget)));
    } else {
      targets.push(baseTarget);
    }
  }

  const activeDays = targets.filter((t) => t > 0);
  if (activeDays.length > 0 && randomizeReps) {
    const desiredTotal = baseTarget * activeDays.length;
    const currentTotal = targets.reduce((sum, t) => sum + t, 0);
    const diff = desiredTotal - currentTotal;

    const activeIndices = targets
      .map((t, i) => (t > 0 ? i : -1))
      .filter((i) => i >= 0);
    const lastActiveIdx = activeIndices[activeIndices.length - 1];
    if (lastActiveIdx !== undefined) {
      const adjusted = targets[lastActiveIdx] + diff;
      targets[lastActiveIdx] = Math.max(1, adjusted);
    }
  }

  return targets;
}
