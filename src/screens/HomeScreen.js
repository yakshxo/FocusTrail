import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Welcome Back!</Text>
      <Text style={styles.subheading}>
        Track your study sessions and discover which environments help you focus best.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Focus</Text>
        <Text style={styles.cardValue}>1h 30m</Text>
        <Text style={styles.cardNote}>Your tracked study time for today</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Best Spot</Text>
        <Text style={styles.cardValue}>Library</Text>
        <Text style={styles.cardNote}>Highest average focus so far</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Summary</Text>
        <Text style={styles.summaryText}>• Sessions this week: 5</Text>
        <Text style={styles.summaryText}>• Average focus: 4.2 / 5</Text>
        <Text style={styles.summaryText}>• Top location: Killam Library</Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate("Session")}
      >
        <Text style={styles.primaryButtonText}>Start Study Session</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("Map")}
      >
        <Text style={styles.secondaryButtonText}>View Study Map</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("Stats")}
      >
        <Text style={styles.secondaryButtonText}>See Stats & Insights</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#f7f8fa",
    flexGrow: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
    color: "#111",
  },
  subheading: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  cardTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 4,
  },
  cardNote: {
    fontSize: 13,
    color: "#888",
  },
  summaryText: {
    fontSize: 15,
    color: "#333",
    marginBottom: 6,
  },
  primaryButton: {
    backgroundColor: "#2e6ef7",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d9d9d9",
  },
  secondaryButtonText: {
    color: "#222",
    fontWeight: "600",
    fontSize: 15,
  },
});