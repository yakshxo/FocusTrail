import { db } from "../../firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

export const saveReview = async (userId, placeId, review) => {
  await addDoc(collection(db, "reviews"), {
    userId,
    placeId,
    ...review,
    createdAt: new Date().toISOString(),
  });
};

export const getReviewsForPlace = async (placeId) => {
  const q = query(
    collection(db, "reviews"),
    where("placeId", "==", placeId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data());
};