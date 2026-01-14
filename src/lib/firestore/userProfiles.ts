import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type UserProfile = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

export async function getUserProfiles(uids: string[]) {
  if (uids.length === 0) return [];

  // Firestore 'in' supports max 10 values (fine for MVP)
  const q = query(collection(db, "users"), where("uid", "in", uids));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserProfile);
}
