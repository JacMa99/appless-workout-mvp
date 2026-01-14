import { nyDateKey } from "@/lib/time/nyDate";

// Returns an array of dateKeys for the last N days (inclusive), oldest -> newest
export function lastNDaysNyDateKeys(nDays: number, now = new Date()): string[] {
  const out: string[] = [];
  for (let i = nDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    out.push(nyDateKey(d));
  }
  return out;
}
