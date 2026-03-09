import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import calculateInsights from "../utils/calculateInsights";

const SAVED_SESSIONS_KEY = "savedStudySessions";

export default function StatsScreen() {
  const [sessions, setSessions] = useState([]);
  const [insights, setInsights] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    averageFocus: 0,
    bestEnvironment: "No data",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const storedSessions = await AsyncStorage.getItem(SAVED_SESSIONS_KEY);
      const parsedSessions = storedSessions ? JSON.parse(storedSessions) : [];

      setSessions(parsedSessions);
      setInsights(calculateInsights(parsedSessions));
    } catch (error) {
      console.log("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTopLocations = () => {
    const locationCounts = {};

    sessions.forEach((session) => {
      const location = session.locationName || "Unknown";
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    return Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  const topLocations = getTopLocations();

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2e6ef7" />
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Stats & Insights</Text>
      <Text style={styles.subtitle}>
        Review your study patterns and best-performing environments.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Total Sessions</Text>
        <Text style={styles.cardValue}>{insights.totalSessions}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Total Study Time</Text>
        <Text style={styles.cardValue}>{insights.totalMinutes} min</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Average Focus</Text>
        <Text style={styles.cardValue}>{insights.averageFocus} / 5</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Best Environment</Text>
        <Text style={styles.cardValue}>{insights.bestEnvironment}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Top Locations</Text>
        {topLocations.length > 0 ? (
          topLocations.map(([location, count], index) => (
            <Text key={index} style={styles.locationItem}>
              {index + 1}. {location} ({count} session{count > 1 ? "s" : ""})
            </Text>
          ))
        ) : (
          <Text style={styles.emptyText}>No saved locations yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Recent Session Summary</Text>
        {sessions.length > 0 ? (
          <>
            <Text style={styles.sessionText}>
              Location: {sessions[sessions.length - 1].locationName || "Unknown"}
            </Text>
            <Text style={styles.sessionText}>
              Focus Rating: {sessions[sessions.length - 1].focusRating || "N/A"}
            </Text>
            <Text style={styles.sessionText}>
              Duration:{" "}
              {Math.floor((sessions[sessions.length - 1].durationInSeconds || 0) / 60)} min
            </Text>
          </>
        ) : (
          <Text style={styles.emptyText}>No session data recorded yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#f7f8fa",
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
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
    color: "#111",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  cardLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111",
  },
  locationItem: {
    fontSize: 15,
    color: "#333",
    marginBottom: 6,
  },
  sessionText: {
    fontSize: 15,
    color: "#333",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
    color: "#888",
    fontStyle: "italic",
  },
});