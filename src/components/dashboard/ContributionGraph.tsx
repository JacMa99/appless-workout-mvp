"use client";

import { useEffect, useMemo, useState } from "react";
import { getLogsSince } from "@/lib/firestore/workoutLogs";
import { lastNDaysNyDateKeys } from "@/lib/time/nyRange";

export function ContributionGraph({ uid }: { uid: string }) {
  // 12 weeks ≈ 84 days
  const days = useMemo(() => lastNDaysNyDateKeys(84), []);
  const since = days[0];

  const [loggedSet, setLoggedSet] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getLogsSince(uid, since)
      .then((logs) => {
        if (cancelled) return;
        setLoggedSet(new Set(logs.map((l) => l.dateKey)));
      })
      .catch((e) => {
        console.error(e);
        setError(e?.message ?? "Failed to load graph.");
      });

    return () => {
      cancelled = true;
    };
  }, [uid, since]);

  // Build 7 rows (Mon-Sun-ish isn’t critical for MVP graph; we just show last 84 days)
  // We'll render as 12 columns x 7 rows by chunking into weeks.
  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="mt-6 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Last 12 weeks</h2>
        <span className="text-xs text-gray-500">{days[0]} → {days[days.length - 1]}</span>
      </div>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 flex gap-1 overflow-x-auto">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((dateKey) => {
              const filled = loggedSet.has(dateKey);
              return (
                <div
                  key={dateKey}
                  title={dateKey + (filled ? " ✅" : "")}
                  className={`h-3 w-3 rounded-sm border ${
                    filled ? "bg-gray-800 border-gray-800" : "bg-white border-gray-200"
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Filled square = you logged a workout that day (America/New_York).
      </div>
    </div>
  );
}
