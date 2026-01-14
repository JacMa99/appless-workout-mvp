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
  
    // generate invite code (not guaranteed unique; good enough for MVP.
    // We'll also query on join, so collisions are extremely unlikely.)
    const inviteCode = randomInviteCode(6);
  
    await setDoc(groupRef, {
      name,
      inviteCode,
      memberIds: [uid],
      memberPhones: {},
      memberNames: {},
      createdAt: serverTimestamp(),
    });
  
    // write user's groupId (enforces one-group MVP)
    await updateDoc(doc(db, "users", uid), { groupId });
  
    return { groupId, inviteCode };
  }
  
  export async function joinGroupByInviteCode(params: { inviteCode: string; uid: string }) {
    const { inviteCode, uid } = params;
  
    const q = query(collection(db, "groups"), where("inviteCode", "==", inviteCode), limit(1));
    const snap = await getDocs(q);
  
    if (snap.empty) throw new Error("No group found for that invite code.");
  
    const groupDoc = snap.docs[0];
    const groupId = groupDoc.id;
  
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
  