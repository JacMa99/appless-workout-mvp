"use client";

import { useEffect, useMemo, useState } from "react";
import { nyDateKey } from "@/lib/time/nyDate";
import {
  getRecentLogs,
  logToday,
  updateWorkoutLog,
  type WorkoutDuration,
  type WorkoutEffort,
  type WorkoutLog,
  type WorkoutType,
} from "@/lib/firestore/workoutLogs";
import { ContributionGraph } from "@/components/dashboard/ContributionGraph";

const TYPES: WorkoutType[] = ["Lift", "Run", "Sport", "Mobility", "Other"];
const EFFORTS: WorkoutEffort[] = ["Easy", "Medium", "Hard"];
const DURATIONS: WorkoutDuration[] = [15, 30, 45, 60, 90];

export function Dashboard({ uid, groupId }: { uid: string; groupId: string }) {
  const todayKey = useMemo(() => nyDateKey(), []);
  const [busyLog, setBusyLog] = useState(false);
  const [recent, setRecent] = useState<Array<{ id: string } & WorkoutLog>>([]);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<WorkoutType | "">("");
  const [effort, setEffort] = useState<WorkoutEffort | "">("");
  const [duration, setDuration] = useState<WorkoutDuration | "">("");
  const [notes, setNotes] = useState("");

  async function refreshRecent() {
    const logs = await getRecentLogs(uid);
    setRecent(logs);

    const today = logs.find((l) => l.dateKey === todayKey);
    if (today) {
      setSelectedDateKey(today.dateKey);
      setType((today.type as any) ?? "");
      setEffort((today.effort as any) ?? "");
      setDuration((today.duration as any) ?? "");
      setNotes((today.notes as any) ?? "");
    } else {
      // if no log today, keep selected as today
      setSelectedDateKey(todayKey);
    }
  }

  useEffect(() => {
    refreshRecent().catch((e) => console.error(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  async function onLogToday() {
    setError(null);
    setStatus(null);
    setBusyLog(true);

    try {
      await logToday(uid, groupId); // ✅ FIXED
      setStatus("Logged ✅");
      await refreshRecent();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to log workout.");
    } finally {
      setBusyLog(false);
    }
  }

  async function onSaveDetails() {
    setError(null);
    setStatus(null);

    try {
      await updateWorkoutLog({
        uid,
        groupId, // ✅ FIXED
        dateKey: selectedDateKey,
        type: type || undefined,
        effort: effort || undefined,
        duration: duration || undefined,
        notes: notes || undefined,
      });

      setStatus("Saved ✅");
      await refreshRecent();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to save details.");
    }
  }

  const loggedToday = recent.some((l) => l.dateKey === todayKey);

  return (
    <main className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold">Workout</h1>
      <p className="mt-2 text-sm text-gray-600">Today (NY): {todayKey}</p>

      <button
        onClick={onLogToday}
        disabled={busyLog}
        className="mt-4 w-full rounded-xl border px-4 py-4 text-lg font-semibold hover:bg-gray-50 disabled:opacity-60"
      >
        {loggedToday ? "✅ Logged today" : busyLog ? "Logging..." : "✅ Log workout"}
      </button>

      <div className="mt-6 rounded-xl border p-4">
        <h2 className="font-semibold">Optional details</h2>
        <p className="mt-1 text-xs text-gray-500">These edit the same log doc (no duplicates).</p>

        <div className="mt-3 grid gap-3">
          <div>
            <label className="text-sm font-semibold">Type</label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
            >
              <option value="">—</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Effort</label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={effort}
              onChange={(e) => setEffort(e.target.value as any)}
            >
              <option value="">—</option>
              {EFFORTS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Duration</label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={duration as any}
              onChange={(e) =>
                setDuration((e.target.value ? Number(e.target.value) : "") as any)
              }
            >
              <option value="">—</option>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Notes (max 280)</label>
            <textarea
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 280))}
              rows={3}
              placeholder="Optional…"
            />
          </div>

          <button onClick={onSaveDetails} className="rounded-lg border px-4 py-2 hover:bg-gray-50">
            Save details
          </button>

          {status ? <p className="text-sm text-green-700">{status}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </div>

      <ContributionGraph uid={uid} />

      <div className="mt-6 rounded-xl border p-4">
        <h2 className="font-semibold">Recent (last 14)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {recent.map((l) => (
            <li key={l.id} className="flex items-center justify-between">
              <span className="font-mono">{l.dateKey}</span>
              <span className="text-gray-600">
                {l.type ?? "—"} {l.duration ? `• ${l.duration}m` : ""}{" "}
                {l.effort ? `• ${l.effort}` : ""}
              </span>
            </li>
          ))}
          {recent.length === 0 ? <li className="text-gray-500">No logs yet.</li> : null}
        </ul>
      </div>
    </main>
  );
}
