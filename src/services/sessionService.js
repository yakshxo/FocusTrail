import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";

export async function saveStudySessionToFirestore(userId, sessionData) {
  if (!userId) {
    throw new Error("User ID is required to save a session.");
  }

  const docRef = await addDoc(collection(db, "sessions"), {
    userId,
    ...sessionData,
  });

  return docRef.id;
}

export async function getUserSessionsFromFirestore(userId) {
  if (!userId) return [];

  const q = query(collection(db, "sessions"), where("userId", "==", userId));
  const snapshot = await getDocs(q);

  const sessions = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return sessions.sort(
    (a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime()
  );
}