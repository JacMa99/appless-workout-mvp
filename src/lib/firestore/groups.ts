import {
    arrayUnion,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    collection,
  } from "firebase/firestore";
  import { db } from "@/lib/firebase/client";
  
  function randomInviteCode(len = 6) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing 0/O/1/I
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }
  
  // groups/{groupId} shape (MVP)
  export type GroupDoc = {
    name: string;
    inviteCode: string;
    memberIds: string[];
    memberPhones: Record<string, string>; // uid -> E.164
    createdAt: unknown;
  };
  
  export async function createGroup(params: { name: string; uid: string }) {
    const { name, uid } = params;
  
    // create groupId first
    const groupRef = doc(collection(db, "groups"));
    const groupId = groupRef.id;
    const inviteCode = randomInviteCode(6);
  
    await setDoc(groupRef, {
      name,
      inviteCode,
      memberIds: [uid],
      memberPhones: {},
      memberNames: {},
      createdAt: serverTimestamp(),
    });
  
    // ✅ NEW: invite code lookup doc
    await setDoc(doc(db, "invite_codes", inviteCode), {
      groupId,
      createdAt: serverTimestamp(),
    });
  
    // write user's groupId (enforces one-group MVP)
    await updateDoc(doc(db, "users", uid), { groupId });
  
    return { groupId, inviteCode };
  }  
  
  export async function joinGroupByInviteCode(params: { inviteCode: string; uid: string }) {
    const { inviteCode, uid } = params;
  
    // ✅ Look up groupId from invite_codes (instead of querying groups)
    const inviteRef = doc(db, "invite_codes", inviteCode);
    const inviteSnap = await getDoc(inviteRef);
  
    if (!inviteSnap.exists()) throw new Error("No group found for that invite code.");
  
    const { groupId } = inviteSnap.data() as { groupId: string };
  
    // add user to group
    await updateDoc(doc(db, "groups", groupId), {
      memberIds: arrayUnion(uid),
    });
  
    // set user's groupId
    await updateDoc(doc(db, "users", uid), { groupId });
  
    return { groupId };
  }  
  
  export async function getGroup(groupId: string) {
    const ref = doc(db, "groups", groupId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Group not found.");
    return { id: snap.id, ...(snap.data() as GroupDoc) };
  }
  