import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { adminDb } from "@/lib/firebase/admin";
import { nyDateKey, diffDays } from "@/lib/time/ny";

export const runtime = "nodejs";

async function getUserDisplayNames(
  db: FirebaseFirestore.Firestore,
  uids: string[]
): Promise<Record<string, string>> {
  const refs = uids.map((uid) => db.collection("users").doc(uid));
  const snaps = await db.getAll(...refs);

  const out: Record<string, string> = {};
  for (const snap of snaps) {
    out[snap.id] =
      (snap.exists && (snap.get("displayName") as string)) || "Someone";
  }

  return out;
}

export async function GET(req: NextRequest) {
  console.log("CRON NUDGES ROUTE HIT", {
    method: req.method,
    url: req.url,
  });

  try {
    const secret =
      req.nextUrl.searchParams.get("secret") ||
      req.headers.get("x-cron-secret");

    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const debug = req.nextUrl.searchParams.get("debug") === "1";
    if (debug) {
      const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64?.trim() || "";

      let b64DecodeOk = false;
      let jsonParseOk = false;
      let hasPrivateKey = false;
      let privateKeyHasLiteralSlashN = false;

      try {
        const decoded = Buffer.from(b64.replace(/\s+/g, ""), "base64").toString("utf8");
        b64DecodeOk = true;

        const obj = JSON.parse(decoded);
        jsonParseOk = true;

        const pk = typeof obj?.private_key === "string" ? obj.private_key : "";
        hasPrivateKey = pk.includes("BEGIN");
        privateKeyHasLiteralSlashN = pk.includes("\\n");
      } catch { }

      return NextResponse.json({
        ok: true,
        debug: true,
        node: process.version,
        vercelEnv: process.env.VERCEL_ENV || null,
        hasB64: Boolean(b64),
        b64Len: b64.length,
        b64DecodeOk,
        jsonParseOk,
        hasPrivateKey,
        privateKeyHasLiteralSlashN,
      });
    }


    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        { error: "Missing Twilio env vars" },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);
    const db = adminDb;

    const today = nyDateKey();

    const groupsSnap = await db.collection("groups").get();

    let sent = 0;
    let considered = 0;

    let groupTriggered = 0;
    let groupSent = 0;
    let privateTriggered = 0;
    let privateDeduped = 0;


    for (const groupDoc of groupsSnap.docs) {
      const groupId = groupDoc.id;
      const group = groupDoc.data();

      const memberIds: string[] = Array.isArray(group.memberIds)
        ? group.memberIds
        : [];
      const memberPhones: Record<string, string> =
        group.memberPhones && typeof group.memberPhones === "object"
          ? group.memberPhones
          : {};

      if (!memberIds.length) continue;

      const lastLogs: Record<string, string | null> = {};

      for (const uid of memberIds) {
        const snap = await db
          .collection("workout_logs")
          .where("uid", "==", uid)
          .orderBy("dateKey", "desc")
          .limit(1)
          .get();

        lastLogs[uid] = snap.empty ? null : (snap.docs[0].get("dateKey") as string);
      }

      // ===== Group nudges: for EACH member who is 3+ days inactive, text ALL members once/day (per inactive person) =====
      const inactive3Plus = memberIds.filter((memberUid) => {
        const lastDateKey = lastLogs[memberUid];
        if (!lastDateKey) return false;
        return diffDays(lastDateKey, today) >= 3;
      });

      if (inactive3Plus.length > 0) {
        // Fetch display names once
        const namesMap = await getUserDisplayNames(db, inactive3Plus);

        for (const inactiveUid of inactive3Plus) {
          const inactiveName = namesMap[inactiveUid] || "Someone";

          // Dedupe PER inactive person PER day
          const groupNudgeId = `${groupId}_${inactiveUid}`;
          const groupNudgeRef = db.collection("nudges_group").doc(groupNudgeId);
          const groupNudgeSnap = await groupNudgeRef.get();

          if (groupNudgeSnap.exists && groupNudgeSnap.get("date") === today) {
            continue; // already sent today's group message for this person
          }

          const body =
            `Support check 💪 ${inactiveName} has been off for 3+ days. ` +
            `If you can, reach out and get a workout in together.`;

          // Send to ALL members individually (no group chat)
          for (const uid of memberIds) {
            const phone = memberPhones[uid];
            if (!phone) continue;

            await client.messages.create({
              to: phone,
              from: fromNumber,
              body,
            });

            sent++;
            groupSent++; // keep your debug counter if still present
          }

          await groupNudgeRef.set(
            {
              date: today,
              groupId,
              inactiveUid,
              inactiveName,
              sentAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      }

      for (const uid of memberIds) {
        const phone = memberPhones[uid];
        if (!phone) continue;

        const lastDateKey = lastLogs[uid];
        if (!lastDateKey) continue;

        const daysInactive = diffDays(lastDateKey, today);
        if (daysInactive < 2) continue;

        considered++;
        if (daysInactive >= 2 && daysInactive < 3) privateTriggered++;

        const nudgeId = `${groupId}_${uid}`;
        const nudgeRef = db.collection("nudges").doc(nudgeId);
        const nudgeSnap = await nudgeRef.get();

        if (nudgeSnap.exists) {
          const lastNudgeDate = nudgeSnap.get("date") as string | undefined;
          if (lastNudgeDate === today) {
            privateDeduped++;
            continue;
          }
        }

        let body: string | null = null;

        if (daysInactive >= 2 && daysInactive < 3) {
          body =
            "Quick nudge 🙂 You haven’t logged a workout in a couple days. No pressure — just checking in.";
        }

        if (!body) continue;

        await client.messages.create({
          to: phone,
          from: fromNumber,
          body,
        });

        await nudgeRef.set(
          {
            date: today,
            daysInactive,
            groupId,
            uid,
            sentAt: new Date().toISOString(),
          },
          { merge: true }
        );

        sent++;
      }
    }

    return NextResponse.json({
      ok: true,
      today,
      considered,
      sent,
      groupTriggered,
      groupSent,
      privateTriggered,
      privateDeduped,
    });
  } catch (err: any) {
    console.error("Cron nudges error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

