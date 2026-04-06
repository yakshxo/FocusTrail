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
    console.log("PHOTO URL:", url);
    if (url) setPhoto(url);
  };

  const handleSave = async () => {
    await saveReview(auth.currentUser.uid, place.id, {
      ratings,
      photo,
    });

    setPhoto(null);
    setRatings({
      coffee: 0,
      noise: 0,
      seating: 0,
      outlets: 0,
    });

    loadReviews();
  };

  const renderStars = (key, label, emoji) => (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingLabel}>
        {emoji} {label}
      </Text>
      <View style={styles.stars}>
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
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <Text style={styles.title}>{place.title}</Text>
      <Text style={styles.subtitle}>{place.description}</Text>

      {/* REVIEWS */}
      <Text style={styles.section}>Community Reviews</Text>

      {reviews.length === 0 ? (
        <Text style={styles.empty}>No reviews yet</Text>
      ) : (
        reviews.map((r, i) => (
          <View key={i} style={styles.reviewCard}>
            <View style={styles.ratingGrid}>
              <Text>☕ {r.ratings.coffee}</Text>
              <Text>🔊 {r.ratings.noise}</Text>
              <Text>💺 {r.ratings.seating}</Text>
              <Text>🔌 {r.ratings.outlets}</Text>
            </View>

            {r.photo && (
              <Image source={{ uri: r.photo }} style={styles.image} />
            )}
          </View>
        ))
      )}

      {/* ADD REVIEW */}
      <Text style={styles.section}>Add Your Review</Text>

      {renderStars("coffee", "Coffee", "☕")}
      {renderStars("noise", "Noise", "🔊")}
      {renderStars("seating", "Seating", "💺")}
      {renderStars("outlets", "Outlets", "🔌")}

      <TouchableOpacity style={styles.photoButton} onPress={handlePhoto}>
        <Text style={styles.photoText}>📷 Add Photo</Text>
      </TouchableOpacity>

      {photo && (
        <Image source={{ uri: photo }} style={styles.previewImage} />
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save Review</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f7f8fa",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111",
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },

  section: {
    marginTop: 22,
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },

  empty: {
    marginTop: 10,
    color: "#888",
  },

  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },

  ratingGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  ratingRow: {
    marginTop: 14,
  },

  ratingLabel: {
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },

  stars: {
    flexDirection: "row",
  },

  star: {
    fontSize: 24,
    marginRight: 6,
    color: "#f5b301",
  },

  photoButton: {
    marginTop: 18,
    backgroundColor: "#2e6ef7",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  photoText: {
    color: "#fff",
    fontWeight: "600",
  },

  saveButton: {
    marginTop: 15,
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  saveText: {
    color: "#fff",
    fontWeight: "bold",
  },

  image: {
  width: "100%",
  height: 200,
  borderRadius: 12,
  marginTop: 10,
  resizeMode: "cover", 
},

  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 10,
  },
});