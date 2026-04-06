import { db } from "../../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export const saveReview = async (userId, placeId, review) => {
  await addDoc(collection(db, "reviews"), {
    userId,
    placeId,
    ...review,
    createdAt: new Date().toISOString(),
  });
};

export const getReviewsForPlace = async (placeId) => {
  const snapshot = await getDocs(collection(db, "reviews"));

  return snapshot.docs
    .map((doc) => doc.data())
    .filter((r) => r.placeId === placeId);
};