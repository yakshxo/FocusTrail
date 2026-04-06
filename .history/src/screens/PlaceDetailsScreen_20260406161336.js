import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { auth } from "../../firebase";
import { takePhotoAndUpload } from "../services/uploadService";
import { saveReview, getReviewsForPlace } from "../services/reviewService";

export default function PlaceDetailsScreen({ route }) {
  const { place } = route.params;

  const [reviews, setReviews] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [ratings, setRatings] = useState({
    coffee: 0,
    noise: 0,
    seating: 0,
    outlets: 0,
  });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    const data = await getReviewsForPlace(place.id);
    setReviews(data);
  };

  const handlePhoto = async () => {
    const url = await takePhotoAndUpload(auth.currentUser.uid);
    if (url) setPhoto(url);
  };

  const handleSave = async () => {
    await saveReview(auth.currentUser.uid, place.id, {
      ratings,
      photo,
    });

    loadReviews();
  };

  const renderStars = (key) => (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => setRatings({ ...ratings, [key]: n })}
        >
          <Text style={styles.star}>
            {ratings[key] >= n ? "★" : "☆"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{place.title}</Text>

      <Text style={styles.section}>Reviews</Text>

      {reviews.map((r, i) => (
        <View key={i} style={styles.reviewCard}>
          <Text>☕ {r.ratings.coffee}</Text>
          <Text>🔊 {r.ratings.noise}</Text>
          <Text>💺 {r.ratings.seating}</Text>
          <Text>🔌 {r.ratings.outlets}</Text>
          {r.photo && <Image source={{ uri: r.photo }} style={styles.image} />}
        </View>
      ))}

      <Text style={styles.section}>Add Review</Text>

      {renderStars("coffee")}
      {renderStars("noise")}
      {renderStars("seating")}
      {renderStars("outlets")}

      <TouchableOpacity onPress={handlePhoto}>
        <Text style={styles.button}>📷 Take Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSave}>
        <Text style={styles.button}>Save Review</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold" },
  section: { marginTop: 20, fontWeight: "bold" },
  row: { flexDirection: "row", gap: 10 },
  star: { fontSize: 22 },
  reviewCard: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 10,
  },
  image: { width: 120, height: 120, marginTop: 5 },
  button: { color: "#2e6ef7", marginTop: 10 },
});