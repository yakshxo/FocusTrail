import { db } from "../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";

// ➕ Add favorite
export const addFavorite = async (userId, place) => {
  await addDoc(collection(db, "favorites"), {
    userId,
    placeId: place.id,
    title: place.title,
    latitude: place.latitude,
    longitude: place.longitude,
    createdAt: new Date().toISOString(),
  });
};

// 📥 Get favorites
export const getFavorites = async (userId) => {
  const q = query(
    collection(db, "favorites"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// ❌ Remove favorite
export const removeFavorite = async (favoriteId) => {
  await deleteDoc(doc(db, "favorites", favoriteId));
};