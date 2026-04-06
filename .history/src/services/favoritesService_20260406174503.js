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

// ➕ Add favorite (NO DUPLICATES)
export const addFavorite = async (userId, place) => {
  try {
    if (!userId) return;

    // 🔍 Check if already exists
    const q = query(
      collection(db, "favorites"),
      where("userId", "==", userId),
      where("placeId", "==", place.id)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      console.log("Already favorited");
      return; // ✅ prevent duplicate
    }

    await addDoc(collection(db, "favorites"), {
      userId,
      placeId: place.id,
      title: place.title,
      latitude: place.latitude,
      longitude: place.longitude,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.log("Add favorite error:", error);
  }
};

// 📥 Get favorites (FILTERED + SAFE)
export const getFavorites = async (userId) => {
  try {
    if (!userId) return [];

    const q = query(
      collection(db, "favorites"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id, // 🔥 IMPORTANT
      ...doc.data(),
    }));
  } catch (error) {
    console.log("Get favorites error:", error);
    return [];
  }
};

// ❌ Remove favorite
export const removeFavorite = async (favoriteId) => {
  try {
    if (!favoriteId) return;

    await deleteDoc(doc(db, "favorites", favoriteId));
  } catch (error) {
    console.log("Remove favorite error:", error);
  }
};