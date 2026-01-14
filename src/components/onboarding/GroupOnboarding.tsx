"use client";

import { useState } from "react";
import { createGroup, joinGroupByInviteCode } from "@/lib/firestore/groups";

export function GroupOnboarding({ uid }: { uid: string }) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onCreate() {
    setError(null);
    setBusy(true);
    try {
      const name = groupName.trim();
      if (!name) throw new Error("Please enter a group name.");
      await createGroup({ name, uid });
    } catch (e: any) {
      setError(e?.message ?? "Failed to create group.");
    } finally {
      setBusy(false);
    }
  }

  async function onJoin() {
    setError(null);
    setBusy(true);
    try {
      const code = inviteCode.trim().toUpperCase();
      if (!code) throw new Error("Please enter an invite code.");
      await joinGroupByInviteCode({ inviteCode: code, uid });
    } catch (e: any) {
      setError(e?.message ?? "Failed to join group.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold">Join your group</h1>
      <p className="mt-2 text-sm text-gray-600">
        MVP rule: you’ll be in exactly <b>one</b> group.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          className={`rounded-lg border px-3 py-2 ${mode === "create" ? "bg-gray-50" : ""}`}
          onClick={() => setMode("create")}
          disabled={busy}
        >
          Create
        </button>
        <button
          className={`rounded-lg border px-3 py-2 ${mode === "join" ? "bg-gray-50" : ""}`}
          onClick={() => setMode("join")}
          disabled={busy}
        >
          Join
        </button>
      </div>

      {mode === "create" ? (
        <div className="mt-4 rounded-xl border p-4">
          <label className="text-sm font-semibold">Group name</label>
          <input
            className="mt-2 w-full rounded-lg border px-3 py-2"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Morning Crew"
            disabled={busy}
          />
          <button
            className="mt-3 rounded-lg border px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
            onClick={onCreate}
            disabled={busy}
          >
            {busy ? "Creating..." : "Create group"}
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border p-4">
          <label className="text-sm font-semibold">Invite code</label>
          <input
            className="mt-2 w-full rounded-lg border px-3 py-2 uppercase"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="e.g. 4K7Q2M"
            disabled={busy}
          />
          <button
            className="mt-3 rounded-lg border px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
            onClick={onJoin}
            disabled={busy}
          >
            {busy ? "Joining..." : "Join group"}
          </button>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </main>
  );
}
