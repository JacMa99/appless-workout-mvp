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
    dateKey: string; // YYYY-MM-DD in America/New_York
    createdAt: unknown;
    updatedAt: unknown;
    // Optional fields
    type?: WorkoutType;
    effort?: WorkoutEffort;
    duration?: WorkoutDuration;
    notes?: string;
  };
  
  export function workoutLogId(uid: string, dateKey: string) {
    return `${uid}_${dateKey}`;
  }
  
  export async function logToday(uid: string) {
    const dateKey = nyDateKey();
    const id = workoutLogId(uid, dateKey);
    const ref = doc(db, "workout_logs", id);
  
    // Upsert (create if missing, update if exists)
    await setDoc(
      ref,
      {
        uid,
        dateKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  
    return { id, dateKey };
  }  
  
  export async function updateWorkoutLog(params: {
    uid: string;
    dateKey: string;
    type?: WorkoutType;
    effort?: WorkoutEffort;
    duration?: WorkoutDuration;
    notes?: string;
  }) {
    const { uid, dateKey, type, effort, duration, notes } = params;
    const ref = doc(db, "workout_logs", workoutLogId(uid, dateKey));
  
    const update: Record<string, any> = {
      uid,
      dateKey,
      updatedAt: serverTimestamp(),
    };
  
    if (type !== undefined) update.type = type;
    if (effort !== undefined) update.effort = effort;
    if (duration !== undefined) update.duration = duration;
    if (notes !== undefined) update.notes = notes.slice(0, 280);
  
    // Upsert details too (so Save works even if log wasn't created yet)
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

  export async function getLogsSince(uid: string, sinceDateKey: string) {
    const q = query(
      collection(db, "workout_logs"),
      where("uid", "==", uid),
      where("dateKey", ">=", sinceDateKey),
      orderBy("dateKey", "desc")
    );
  
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as WorkoutLog) }));
  }  

  export async function getLogsForUsersSince(uids: string[], sinceDateKey: string) {
    if (uids.length === 0) return [];
  
    // Firestore "in" supports up to 10 values.
    // MVP: groups are small. If >10 later, we’ll batch.
    const q = query(
      collection(db, "workout_logs"),
      where("uid", "in", uids),
      where("dateKey", ">=", sinceDateKey),
      orderBy("dateKey", "desc")
    );
  
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as WorkoutLog) }));
  }
  
  