import * as ImagePicker from "expo-image-picker";

export const takePhotoAndUpload = async () => {
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

  return uri; // 
};