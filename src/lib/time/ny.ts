// src/lib/time/ny.ts

const TZ = "America/New_York";

/**
 * Returns YYYY-MM-DD in America/New_York for a given Date (default: now).
 * Uses Intl so DST boundaries are handled correctly for the local date key.
 */
export function nyDateKey(d: Date = new Date()): string {
  // en-CA yields YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Parses YYYY-MM-DD into a UTC Date at midnight (00:00Z) for day-diff math.
 * (We only care about whole-day differences between date keys.)
 */
export function dateKeyToUtcDate(dateKey: string): Date {
  const [y, m, day] = dateKey.split("-").map((x) => parseInt(x, 10));
  return new Date(Date.UTC(y, m - 1, day));
}

/**
 * Whole days between two YYYY-MM-DD keys: end - start
 */
export function diffDays(dateKeyStart: string, dateKeyEnd: string): number {
  const a = dateKeyToUtcDate(dateKeyStart).getTime();
  const b = dateKeyToUtcDate(dateKeyEnd).getTime();
  return Math.floor((b - a) / 86400000);
}
