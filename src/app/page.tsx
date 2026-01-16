"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserDoc } from "@/lib/firestore/useUserDoc";
import { GroupOnboarding } from "@/components/onboarding/GroupOnboarding";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { syncMemberName } from "@/lib/firestore/syncMemberName";

export default function HomePage() {
  const { user, isLoading, signInWithGoogle, signOutUser } = useAuth();
  const { userDoc, isLoading: userDocLoading } = useUserDoc(user?.uid);

  // ✅ Hook always runs, but function only executes once groupId exists
  useEffect(() => {
    if (!user || !userDoc?.groupId) return;

    syncMemberName({
      groupId: userDoc.groupId,
      uid: user.uid,
      displayName: user.displayName ?? null,
      email: user.email ?? null,
    }).catch((e) => console.error("syncMemberName failed", e));
  }, [user, userDoc?.groupId]);

  if (isLoading) return <main className="p-6">Loading…</main>;

  if (!user) {
    return (
      <main className="p-6 max-w-xl">
        <h1 className="text-2xl font-bold">Appless Workout MVP</h1>
        <p className="mt-2 text-sm text-gray-600">Sign in to continue.</p>
        <button
          onClick={() => signInWithGoogle()}
          className="mt-4 rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          Continue with Google
        </button>
      </main>
    );
  }

  if (userDocLoading) return <main className="p-6">Loading profile…</main>;
  if (!userDoc) return <main className="p-6">Profile not found. Refresh.</main>;

  if (!userDoc.groupId) {
    return <GroupOnboarding uid={user.uid} />;
  }

  return (
    <div>
      <div className="p-6 max-w-xl flex gap-2">
        <a className="rounded-lg border px-4 py-2 hover:bg-gray-50" href="/settings">
          Settings
        </a>
        <a className="rounded-lg border px-4 py-2 hover:bg-gray-50" href="/group">
          Group
        </a>
        <button
          onClick={() => signOutUser()}
          className="rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>

      {/* ✅ UPDATED: pass groupId */}
      <Dashboard uid={user.uid} groupId={userDoc.groupId} />
    </div>
  );
}

