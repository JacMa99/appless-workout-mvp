"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserDoc } from "@/lib/firestore/useUserDoc";
import { getLogsForUsersSince, type WorkoutLog } from "@/lib/firestore/workoutLogs";
import { nyDateKey } from "@/lib/time/nyDate";
import { thisWeekNyRange, daysAgoNy } from "@/lib/time/nyStats";

type GroupDoc = {
    name: string;
    memberIds: string[];
    memberNames?: Record<string, string>;
  };  

export default function GroupPage() {
  const { user, isLoading } = useAuth();
  const { userDoc, isLoading: userDocLoading } = useUserDoc(user?.uid);

  const [group, setGroup] = useState<GroupDoc | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const todayKey = nyDateKey();
  const weekKeys = useMemo(() => thisWeekNyRange(), []);
  const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

  // Load group doc
  useEffect(() => {
    if (!userDoc?.groupId) return;

    const ref = doc(db, "groups", userDoc.groupId);
    const unsub = onSnapshot(
      ref,
      (snap) => setGroup(snap.data() as GroupDoc),
      (e) => {
        console.error(e);
        setError("Failed to load group.");
      }
    );

    return () => unsub();
  }, [userDoc?.groupId]);

  // Load logs since Monday (for weekly stats + today)
  useEffect(() => {
    if (!group?.memberIds || group.memberIds.length === 0) return;

    const since = weekKeys[0]; // Monday
    getLogsForUsersSince(group.memberIds, since)
      .then(setLogs)
      .catch((e) => {
        console.error(e);
        setError("Failed to load logs.");
      });
  }, [group?.memberIds, weekKeys]);

  // ✅ Now conditional renders (after hooks)
  if (isLoading || userDocLoading) return <main className="p-6">Loading…</main>;
  if (!user || !userDoc?.groupId) return <main className="p-6">No group.</main>;
  if (!group) return <main className="p-6">Loading group…</main>;

  const rows = group.memberIds.map((uid) => {
    const userLogs = logs.filter((l) => l.uid === uid);
    const dateKeys = userLogs.map((l) => l.dateKey);
    const weekSet = new Set(dateKeys.filter((k) => weekKeys.includes(k)));

    const loggedToday = dateKeys.includes(todayKey);
    const daysThisWeek = weekKeys.filter((k) => dateKeys.includes(k)).length;

    const lastLog = userLogs[0]?.dateKey ?? null;
    const daysAgo = lastLog ? daysAgoNy(lastLog) : null;

    const name = group.memberNames?.[uid] || `${uid.slice(0, 6)}…`;

    return { uid, name, loggedToday, daysThisWeek, lastLog, daysAgo, weekSet };
  });

  return (
    <main className="p-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <Link className="text-sm underline" href="/">
          Back
        </Link>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 rounded-xl border divide-y">
        {rows.map((r) => (
          <div key={r.uid} className="p-3 flex items-center justify-between text-sm">
            <div>
              <div className="font-semibold">{r.name}</div>
              <div className="text-gray-600">
                {r.lastLog ? `Last: ${r.lastLog} (${r.daysAgo}d ago)` : "No logs yet"}
              </div>
              <div className="mt-2 flex items-center gap-1">
                {weekKeys.map((k, i) => {
                const filled = r.weekSet.has(k);
                return (
                    <div
                      key={k}
                      title={`${WEEKDAY_LABELS[i]} ${k}${filled ? " ✅" : ""}`}
                      className={`h-3 w-3 rounded-sm border ${
                        filled ? "bg-gray-800 border-gray-800" : "bg-white border-gray-200"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="text-right">
              <div>{r.loggedToday ? "✅ Today" : "— Today"}</div>
              <div className="text-gray-600">{r.daysThisWeek} days this week</div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Times are based on America/New_York. No leaderboards, no shaming.
      </p>
    </main>
  );
}
