import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initAdmin() {
  if (getApps().length) return;

  // ✅ Always prefer Base64 service account JSON (Vercel-safe)
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64?.trim();

  if (b64) {
    const clean = b64.replace(/\s+/g, "");
    const json = JSON.parse(Buffer.from(clean, "base64").toString("utf8"));

    // ✅ CRITICAL: normalize private_key newlines if they came through as "\\n"
    if (typeof json.private_key === "string") {
      json.private_key = json.private_key.replace(/\\n/g, "\n");
    }

    initializeApp({
      credential: cert(json),
    });
    return;
  }

  // ✅ Local fallback (.env.local)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_B64 (recommended) or FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY."
    );
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

initAdmin();
export const adminDb = getFirestore();
