import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase/client";

export async function ensureUserDoc(user: User) {
  const ref = doc(db, "users", user.uid);

  // merge:true ensures we don't overwrite fields later
  await setDoc(
    ref,
    {
      uid: user.uid,
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      photoURL: user.photoURL ?? null,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(), // ok with merge; first write sets it
    },
    { merge: true }
  );
}
