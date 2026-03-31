export const ACTIVITY_TYPES = [
  "pushups", "situps", "squats", "pullups", "burpees", "running", 
  "walking", "cycling", "swimming", "steps", "meditation", "reading", 
  "water", "custom"
] as const;

export function getUnitForActivity(activity: string): string {
  const map: Record<string, string> = {
    pushups: "reps", situps: "reps", squats: "reps", pullups: "reps", burpees: "reps",
    running: "km", walking: "km", cycling: "km", swimming: "m",
    steps: "steps", meditation: "mins", reading: "pages", water: "ml"
  };
  return map[activity] || "units";
}

export function formatActivityName(activity: string): string {
  return activity.charAt(0).toUpperCase() + activity.slice(1);
}
