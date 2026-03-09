import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

export default function ProfileScreen() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (auth.currentUser) {
      setEmail(auth.currentUser.email || "No email found");
    }
  }, []);

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
      <Text style={styles.subtitle}>Manage your account and app overview here.</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Logged In As</Text>
        <Text style={styles.cardValue}>{email || "No active user"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>App Purpose</Text>
        <Text style={styles.cardText}>
          FocusTrail helps students track study sessions and compare how different
          environments affect focus and productivity.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Current Prototype Status</Text>
        <Text style={styles.featureItem}>• Authentication working</Text>
        <Text style={styles.featureItem}>• Study session timer working</Text>
        <Text style={styles.featureItem}>• AsyncStorage implemented</Text>
        <Text style={styles.featureItem}>• Map and GPS integrated</Text>
        <Text style={styles.featureItem}>• Stats screen implemented</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Upcoming Milestone 3 Work</Text>
        <Text style={styles.featureItem}>• External places API integration</Text>
        <Text style={styles.featureItem}>• Improved analytics and insights</Text>
        <Text style={styles.featureItem}>• Firestore session persistence</Text>
        <Text style={styles.featureItem}>• UI polish and refinement</Text>
      </View>

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
  button: {
    backgroundColor: "#b23b3b",
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 30,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});