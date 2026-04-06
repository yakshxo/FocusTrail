import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";
import { getUserSessionsFromFirestore } from "../services/sessionService";
import { getFavorites, removeFavorite } from "../services/favoritesService";

const ACTIVE_SESSION_KEY = "activeStudySession";
const SAVED_SESSIONS_KEY = "savedStudySessions";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sessionCount, setSessionCount] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [averageFocus, setAverageFocus] = useState(0);
  const [bestEnvironment, setBestEnvironment] = useState("No data yet");
  const [favorites, setFavorites] = useState([]);

useEffect(() => {
  loadProfileData();
  loadFavorites();
}, []);

const loadProfileData = async () => {
  try {
    setLoading(true);

    if (!auth.currentUser) {
      setEmail("");
      setSessionCount(0);
      setTotalMinutes(0);
      setAverageFocus(0);
      setBestEnvironment("No data yet");
      return;
    }

    setEmail(auth.currentUser.email || "No email found");

    const sessions = await getUserSessionsFromFirestore(auth.currentUser.uid);

    setSessionCount(sessions.length);

    const totalStudyMinutes = sessions.reduce(
      (sum, session) => sum + (session.durationMinutes || 0),
      0
    );
    setTotalMinutes(totalStudyMinutes);

    if (sessions.length > 0) {
      const avg =
        sessions.reduce((sum, session) => sum + (session.focusRating || 0), 0) /
        sessions.length;
      setAverageFocus(Number(avg.toFixed(1)));

      const environmentScores = {};
      sessions.forEach((session) => {
        const environment =
          session.environment || session.locationName || "Unknown";

        if (!environmentScores[environment]) {
          environmentScores[environment] = { total: 0, count: 0 };
        }

        environmentScores[environment].total += session.focusRating || 0;
        environmentScores[environment].count += 1;
      });

      let bestEnv = "No data yet";
      let bestScore = -1;

      Object.keys(environmentScores).forEach((environment) => {
        const avgEnv =
          environmentScores[environment].total /
          environmentScores[environment].count;

        if (avgEnv > bestScore) {
          bestScore = avgEnv;
          bestEnv = environment;
        }
      });

      setBestEnvironment(bestEnv);
    } else {
      setAverageFocus(0);
      setBestEnvironment("No data yet");
    }
  } catch (error) {
    console.log("Profile data load error:", error);
    Alert.alert("Error", "Could not load profile data.");
  } finally {
    setLoading(false);
  }
};

const loadFavorites = async () => {
  try {
    if (!auth.currentUser) return;

    const data = await getFavorites(auth.currentUser.uid);
    setFavorites(data);
  } catch (error) {
    console.log("Favorites load error:", error);
  }
};

  const formatMinutes = (minutes) => {
    if (!minutes || minutes <= 0) return "0 min";

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
  };

  const handleClearLocalCache = async () => {
    Alert.alert(
      "Clear Local Cache",
      "This will remove locally cached session data from the device. Firestore data will remain saved. Do you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
              await AsyncStorage.removeItem(SAVED_SESSIONS_KEY);
              Alert.alert("Success", "Local cached session data has been cleared.");
            } catch (error) {
              console.log("Error clearing local cache:", error);
              Alert.alert("Error", "Could not clear local cache.");
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    try {
      if (!auth.currentUser || !auth.currentUser.email) {
        Alert.alert("Error", "No logged-in email found.");
        return;
      }

      await sendPasswordResetEmail(auth, auth.currentUser.email);

      Alert.alert(
        "Password Reset Email Sent",
        `A password reset link has been sent to ${auth.currentUser.email}.`
      );
    } catch (error) {
      console.log("Password reset error:", error);
      Alert.alert("Error", "Could not send password reset email.");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (error) {
            Alert.alert("Logout failed", error.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2e6ef7" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>
        Account details, session summary, and app controls.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Logged In As</Text>
        <Text style={styles.cardValueSmall}>{email || "No active user"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Study Summary</Text>
        <Text style={styles.featureItem}>• Total sessions: {sessionCount}</Text>
        <Text style={styles.featureItem}>
          • Total study time: {formatMinutes(totalMinutes)}
        </Text>
        <Text style={styles.featureItem}>
          • Average focus: {averageFocus} / 5
        </Text>
        <Text style={styles.featureItem}>
          • Best environment: {bestEnvironment}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>About FocusTrail</Text>
        <Text style={styles.cardText}>
          FocusTrail helps students track study sessions, evaluate focus levels,
          and compare how different environments affect productivity.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Feature Status</Text>
        <Text style={styles.featureItem}>• Authentication working</Text>
        <Text style={styles.featureItem}>• Firestore session saving working</Text>
        <Text style={styles.featureItem}>• GPS and map integration working</Text>
        <Text style={styles.featureItem}>• Nearby study places API working</Text>
        <Text style={styles.featureItem}>• Session history interface working</Text>
        <Text style={styles.featureItem}>• Password reset by email working</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Coming Next</Text>
        <Text style={styles.item}>• Camera feature for study spot photos</Text>
        <Text style={styles.item}>• Review system for study locations</Text>
        <Text style={styles.item}>• Ratings (coffee, noise, seating, power outlets)</Text>
        <Text style={styles.item}>• Dedicated favorites feature (save preferred spots)</Text>
        <Text style={styles.item}>• Advanced productivity analytics</Text>
      </View>

      <View style={styles.card}>
  <Text style={styles.cardLabel}>Saved Places</Text>

  {favorites.length === 0 ? (
    <Text style={styles.cardText}>No favorites yet.</Text>
  ) : (
    favorites.map((fav) => (
      <View key={fav.id} style={styles.favoriteRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.favoritePlaceTitle}>{fav.title}</Text>
        </View>

        <TouchableOpacity
          onPress={async () => {
            await removeFavorite(fav.id);
            loadFavorites();
          }}
        >
          <Text style={styles.removeFavoriteText}>Remove</Text>
        </TouchableOpacity>
      </View>
    ))
  )}
</View>

      <TouchableOpacity style={styles.primaryButton} onPress={loadProfileData}>
        <Text style={styles.primaryButtonText}>Refresh Profile Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleChangePassword}>
        <Text style={styles.secondaryButtonText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleClearLocalCache}>
        <Text style={styles.secondaryButtonText}>Clear Local Cache</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f4f7f4",
    padding: 24,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f8fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: "#666",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2a1f",
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#5f6f5f",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#d8e2d8",
  },
  cardLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  cardValueSmall: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2a1f",
  },
  cardText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  featureItem: {
    fontSize: 15,
    color: "#333",
    marginBottom: 6,
  },
  primaryButton: {
    backgroundColor: "#2e6ef7",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d9d9d9",
  },
  secondaryButtonText: {
    color: "#222",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#b23b3b",
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  favoriteRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: 8,
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
},

favoritePlaceTitle: {
  fontSize: 15,
  fontWeight: "600",
  color: "#222",
},

removeFavoriteText: {
  color: "#b23b3b",
  fontSize: 14,
  fontWeight: "600",
},
});