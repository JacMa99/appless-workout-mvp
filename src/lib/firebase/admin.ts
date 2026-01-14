// src/lib/firebase/admin.ts
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initAdmin() {
    if (getApps().length) return;

    const projectId = process.env.FIREBASE_PROJECT_ID;

    // Support either name so you can't get stuck on a typo
    const clientEmail =
        process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;

    // Strip wrapping quotes if Vercel saved them, then convert \n -> real newlines
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
    const privateKey = privateKeyRaw
        ?.replace(/^"|"$/g, "")
        .replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            "Missing Firebase Admin env vars. Need FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL (or FIREBASE_CLIENT_EMAIL), FIREBASE_PRIVATE_KEY."
        );
    }

    initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });
}

initAdmin();

export const adminDb = getFirestore();
