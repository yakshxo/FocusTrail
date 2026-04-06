import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDHfAYnolK8saSt8e6t07MovWyZBBFep8c",
  authDomain: "focustrail-dal.firebaseapp.com",
  projectId: "focustrail-dal",
  storageBucket: "focustrail-dal.appspot.com", // ✅ IMPORTANT FIX
  messagingSenderId: "417907407978",
  appId: "1:417907407978:web:59b6fe52849d93af671e13",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

export const storage = getStorage(app);