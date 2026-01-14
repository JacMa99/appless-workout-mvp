import { nyDateKey } from "@/lib/time/nyDate";

// Monday → Sunday week range (NY)
export function thisWeekNyRange(now = new Date()) {
  const todayKey = nyDateKey(now);
  const [y, m, d] = todayKey.split("-").map(Number);

  // Use UTC math but based on NY dateKey
  const base = new Date(Date.UTC(y, m - 1, d));
  const day = base.getUTCDay(); // 0=Sun, 1=Mon

  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(base.getTime() - diffToMonday * 86400000);

  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(monday.getTime() + i * 86400000);
    keys.push(nyDateKey(dt));
  }

  return keys; // length 7, Mon..Sun
}

export function daysAgoNy(fromDateKey: string, now = new Date()) {
  const todayKey = nyDateKey(now);
  const [y1, m1, d1] = fromDateKey.split("-").map(Number);
  const [y2, m2, d2] = todayKey.split("-").map(Number);

  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.max(0, Math.floor((t2 - t1) / 86400000));
}
