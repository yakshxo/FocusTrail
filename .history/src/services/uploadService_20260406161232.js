import * as ImagePicker from "expo-image-picker";
import { storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const takePhotoAndUpload = async (userId) => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== "granted") {
    alert("Camera permission required");
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.5,
  });

  if (result.canceled) return null;

  const uri = result.assets[0].uri;

  const response = await fetch(uri);
  const blob = await response.blob();

  const filename = `reviews/${userId}_${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);

  await uploadBytes(storageRef, blob);

  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
};