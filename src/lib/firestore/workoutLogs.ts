import {
  doc,
  serverTimestamp,
  setDoc,
  query,
  collection,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { nyDateKey } from "@/lib/time/nyDate";

export type WorkoutType = "Lift" | "Run" | "Sport" | "Mobility" | "Other";
export type WorkoutEffort = "Easy" | "Medium" | "Hard";
export type WorkoutDuration = 15 | 30 | 45 | 60 | 90;

export type WorkoutLog = {
  uid: string;
  groupId?: string; // ✅ NEW (required for group squares / rules)
  dateKey: string; // YYYY-MM-DD in America/New_York
  createdAt: unknown;
  updatedAt: unknown;
  type?: WorkoutType;
  effort?: WorkoutEffort;
  duration?: WorkoutDuration;
  notes?: string;
};

export function workoutLogId(uid: string, dateKey: string) {
  return `${uid}_${dateKey}`;
}

// ✅ UPDATED SIGNATURE: needs groupId
export async function logToday(uid: string, groupId: string) {
  const dateKey = nyDateKey();
  const id = workoutLogId(uid, dateKey);
  const ref = doc(db, "workout_logs", id);

  await setDoc(
    ref,
    {
      uid,
      groupId, // ✅ add
      dateKey,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { id, dateKey };
}

// ✅ UPDATED SIGNATURE: needs groupId
export async function updateWorkoutLog(params: {
  uid: string;
  groupId: string;
  dateKey: string;
  type?: WorkoutType;
  effort?: WorkoutEffort;
  duration?: WorkoutDuration;
  notes?: string;
}) {
  const { uid, groupId, dateKey, type, effort, duration, notes } = params;
  const ref = doc(db, "workout_logs", workoutLogId(uid, dateKey));

  const update: Record<string, any> = {
    uid,
    groupId, // ✅ add
    dateKey,
    updatedAt: serverTimestamp(),
  };

  if (type !== undefined) update.type = type;
  if (effort !== undefined) update.effort = effort;
  if (duration !== undefined) update.duration = duration;
  if (notes !== undefined) update.notes = notes.slice(0, 280);

  await setDoc(ref, update, { merge: true });
}

export async function getRecentLogs(uid: string) {
  const q = query(
    collection(db, "workout_logs"),
    where("uid", "==", uid),
    orderBy("dateKey", "desc"),
    limit(14)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as WorkoutLog) }));
}

export async function getLogsSince(uid: string, groupId: string, sinceDateKey: string) {
  const q = query(
    collection(db, "workout_logs"),
    where("groupId", "==", groupId),
    where("uid", "==", uid),
    where("dateKey", ">=", sinceDateKey),
    orderBy("dateKey", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}


export async function getLogsForUsersSince(
  uids: string[],
  groupId: string,
  sinceDateKey: string
) {
  if (uids.length === 0) return [];

  const q = query(
    collection(db, "workout_logs"),
    where("groupId", "==", groupId),     // ✅ ADD THIS
    where("uid", "in", uids),
    where("dateKey", ">=", sinceDateKey),
    orderBy("dateKey", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as WorkoutLog) }));
}

