import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export async function syncMemberName(params: {
  groupId: string;
  uid: string;
  displayName: string | null;
  email: string | null;
}) {
  const { groupId, uid, displayName, email } = params;
  const name = displayName || email || "Member";

  const ref = doc(db, "groups", groupId);
  await updateDoc(ref, {
    [`memberNames.${uid}`]: name,
  });
}
