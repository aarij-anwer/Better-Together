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

  const activeIndices = targets
    .map((t, i) => (t > 0 ? i : -1))
    .filter((i) => i >= 0);

  if (activeIndices.length > 0 && randomizeReps) {
    const desiredTotal = baseTarget * activeIndices.length;
    let currentTotal = targets.reduce((sum, t) => sum + t, 0);
    let remaining = desiredTotal - currentTotal;

    for (let pass = 0; pass < 10 && Math.abs(remaining) > 0; pass++) {
      const indices =
        remaining > 0
          ? [...activeIndices].reverse()
          : [...activeIndices];

      for (const idx of indices) {
        if (remaining === 0) break;
        const current = targets[idx];
        if (remaining > 0) {
          const room = maxTarget - current;
          if (room > 0) {
            const add = Math.min(remaining, room);
            targets[idx] = current + add;
            remaining -= add;
          }
        } else {
          const room = current - Math.max(minTarget, 1);
          if (room > 0) {
            const sub = Math.min(-remaining, room);
            targets[idx] = current - sub;
            remaining += sub;
          }
        }
      }
    }
  }

  return targets;
}
