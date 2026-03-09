import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { getUserSessionsFromFirestore } from "../services/sessionService";

export default function ProfileScreen() {
  const [email, setEmail] = useState("");
  const [sessionCount, setSessionCount] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [averageFocus, setAverageFocus] = useState(0);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      if (auth.currentUser) {
        setEmail(auth.currentUser.email || "No email found");

        const sessions = await getUserSessionsFromFirestore(auth.currentUser.uid);
        setSessionCount(sessions.length);

        const minutes = sessions.reduce(
          (sum, session) => sum + (session.durationMinutes || 0),
          0
        );
        setTotalMinutes(minutes);

        if (sessions.length > 0) {
          const avg =
            sessions.reduce((sum, session) => sum + (session.focusRating || 0), 0) /
            sessions.length;
          setAverageFocus(Number(avg.toFixed(1)));
        } else {
          setAverageFocus(0);
        }
      }
    } catch (error) {
      console.log("Profile data load error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert("Logout failed", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Account details and prototype progress.</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Logged In As</Text>
        <Text style={styles.cardValue}>{email || "No active user"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Study Summary</Text>
        <Text style={styles.featureItem}>• Total sessions: {sessionCount}</Text>
        <Text style={styles.featureItem}>• Total minutes: {totalMinutes}</Text>
        <Text style={styles.featureItem}>• Average focus: {averageFocus} / 5</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>App Purpose</Text>
        <Text style={styles.cardText}>
          FocusTrail helps students track study sessions and compare how different
          environments affect focus and productivity.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Milestone 2 Completed Features</Text>
        <Text style={styles.featureItem}>• Authentication working</Text>
        <Text style={styles.featureItem}>• Study session timer working</Text>
        <Text style={styles.featureItem}>• AsyncStorage implemented</Text>
        <Text style={styles.featureItem}>• Firestore session saving added</Text>
        <Text style={styles.featureItem}>• GPS and map integration working</Text>
        <Text style={styles.featureItem}>• Nearby study places API added</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Milestone 3 Planned Improvements</Text>
        <Text style={styles.featureItem}>• UI polish and refinement</Text>
        <Text style={styles.featureItem}>• Better analytics and insights</Text>
        <Text style={styles.featureItem}>• Improved environment categories</Text>
        <Text style={styles.featureItem}>• Camera/photo study spot feature</Text>
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={loadProfileData}>
        <Text style={styles.secondaryButtonText}>Refresh Profile Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
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
  cardValue: {
    fontSize: 20,
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
  secondaryButton: {
    backgroundColor: "#2e6ef7",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#b23b3b",
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});