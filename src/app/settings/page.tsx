"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserDoc } from "@/lib/firestore/useUserDoc";
import { db } from "@/lib/firebase/client";
import Link from "next/link";
import { Dashboard } from "@/components/dashboard/Dashboard";

function isE164(phone: string) {
  // Very simple E.164 check: + and 8-15 digits
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const { userDoc, isLoading: userDocLoading } = useUserDoc(user?.uid);

  const groupId = userDoc?.groupId;
  const [currentPhone, setCurrentPhone] = useState<string>("");
  const [inputPhone, setInputPhone] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Listen to group doc to get current phone
  useEffect(() => {
    if (!user?.uid || !groupId) return;

    const ref = doc(db, "groups", groupId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as any;
        const phone = (data?.memberPhones?.[user.uid] as string) ?? "";
        setCurrentPhone(phone);
        setInputPhone(phone);
      },
      (err) => {
        console.error("settings group snapshot error", err);
        setError("Failed to load group.");
      }
    );

    return () => unsub();
  }, [user?.uid, groupId]);

  const ready = useMemo(() => {
    return !isLoading && !userDocLoading && !!user && !!groupId;
  }, [isLoading, userDocLoading, user, groupId]);

  async function onSave() {
    setError(null);
    setStatus(null);

    if (!user?.uid || !groupId) return;

    const phone = inputPhone.trim();
    if (phone.length === 0) {
      setError("Please enter a phone number in E.164 format (example: +19175551234).");
      return;
    }
    if (!isE164(phone)) {
      setError("Invalid format. Use E.164 like +19175551234.");
      return;
    }

    setBusy(true);
    try {
      const ref = doc(db, "groups", groupId);
      await updateDoc(ref, {
        [`memberPhones.${user.uid}`]: phone,
      });
      setStatus("Saved ✅");
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to save.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || userDocLoading) return <main className="p-6">Loading…</main>;
  if (!user) return <main className="p-6">Please sign in.</main>;
  if (!groupId) return <main className="p-6">Please join a group first.</main>;

  return (
    <main className="p-6 max-w-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Link className="text-sm underline" href="/">
          Back
        </Link>
      </div>

      <p className="mt-2 text-sm text-gray-600">
        Add your phone number (E.164). We’ll use it for SMS nudges. No verification for MVP.
      </p>

      <div className="mt-4 rounded-xl border p-4">
        <label className="text-sm font-semibold">Phone (E.164)</label>
        <input
          className="mt-2 w-full rounded-lg border px-3 py-2"
          placeholder="+19175551234"
          value={inputPhone}
          onChange={(e) => setInputPhone(e.target.value)}
          disabled={!ready || busy}
        />

        <div className="mt-2 text-xs text-gray-500">
          Current saved: <span className="font-mono">{currentPhone || "(none)"}</span>
        </div>

        <button
          className="mt-3 rounded-lg border px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
          onClick={onSave}
          disabled={!ready || busy}
        >
          {busy ? "Saving..." : "Save"}
        </button>

        {status ? <p className="mt-3 text-sm text-green-700">{status}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="mt-6 rounded-xl border p-4 text-sm text-gray-600">
        <b>Twilio trial note:</b> If you’re on a Twilio trial, you can only text verified numbers.
        We’ll handle that when we integrate SMS.
      </div>
    </main>
  );
}
