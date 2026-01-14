"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type UserDoc = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  groupId?: string; // present once onboarded
};

export function useUserDoc(uid: string | undefined) {
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setUserDoc(null);
      setIsLoading(false);
      return;
    }

    const ref = doc(db, "users", uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setUserDoc((snap.data() as UserDoc) ?? null);
        setIsLoading(false);
      },
      (err) => {
        console.error("useUserDoc snapshot error", err);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  return { userDoc, isLoading };
}
