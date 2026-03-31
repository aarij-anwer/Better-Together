export const ACTIVITY_TYPES = [
  "pushups", "situps", "squats", "pullups", "burpees", "running", 
  "walking", "cycling", "swimming", "steps", "meditation", "reading", 
  "water"
] as const;

export function getUnitForActivity(activity: string): string {
  const map: Record<string, string> = {
    pushups: "reps", situps: "reps", squats: "reps", pullups: "reps", burpees: "reps",
    running: "km", walking: "km", cycling: "km", swimming: "m",
    steps: "steps", meditation: "mins", reading: "pages", water: "ml"
  };
  return map[activity] || "units";
}

export function getDefaultTarget(activity: string): number {
  const map: Record<string, number> = {
    pushups: 50,
    situps: 50,
    squats: 50,
    pullups: 10,
    burpees: 20,
    running: 5,
    walking: 5,
    cycling: 10,
    swimming: 500,
    steps: 10000,
    meditation: 15,
    reading: 20,
    water: 2000,
    custom: 10,
  };
  return map[activity] || 10;
}

export function formatActivityName(activity: string): string {
  return activity.charAt(0).toUpperCase() + activity.slice(1);
}
