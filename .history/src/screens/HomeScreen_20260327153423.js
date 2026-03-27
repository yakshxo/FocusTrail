import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { auth } from "../../firebase";
import { getUserSessionsFromFirestore } from "../services/sessionService";

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    averageFocus: 0,
    bestEnvironment: "No data yet",
    recentLocation: "No sessions yet",
  });

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      if (!auth.currentUser) {
        setSummary({
          totalSessions: 0,
          totalMinutes: 0,
          averageFocus: 0,
          bestEnvironment: "No data yet",
          recentLocation: "No sessions yet",
        });
        return;
      }

      const sessions = await getUserSessionsFromFirestore(auth.currentUser.uid);

      if (!sessions.length) {
        setSummary({
          totalSessions: 0,
          totalMinutes: 0,
          averageFocus: 0,
          bestEnvironment: "No data yet",
          recentLocation: "No sessions yet",
        });
        return;
      }

      const totalSessions = sessions.length;

      const totalMinutes = sessions.reduce(
        (sum, session) => sum + (session.durationMinutes || 0),
        0
      );

      const averageFocus =
        sessions.reduce((sum, session) => sum + (session.focusRating || 0), 0) /
        totalSessions;

      const environmentScores = {};
      sessions.forEach((session) => {
        const environment = session.environment || session.locationName || "Unknown";

        if (!environmentScores[environment]) {
          environmentScores[environment] = { total: 0, count: 0 };
        }

        environmentScores[environment].total += session.focusRating || 0;
        environmentScores[environment].count += 1;
      });

      let bestEnvironment = "No data yet";
      let bestScore = -1;

      Object.keys(environmentScores).forEach((environment) => {
        const avg =
          environmentScores[environment].total /
          environmentScores[environment].count;

        if (avg > bestScore) {
          bestScore = avg;
          bestEnvironment = environment;
        }
      });

      const recentLocation =
        sessions[0]?.locationName || sessions[0]?.environment || "No sessions yet";

      setSummary({
        totalSessions,
        totalMinutes,
        averageFocus: Number(averageFocus.toFixed(1)),
        bestEnvironment,
        recentLocation,
      });
    } catch (error) {
      console.log("Error loading home analytics:", error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2e6ef7" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Welcome Back!</Text>
      <Text style={styles.subheading}>
        Track your study sessions and discover which environments help you focus best.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Study Time</Text>
        <Text style={styles.cardValue}>{formatMinutes(summary.totalMinutes)}</Text>
        <Text style={styles.cardNote}>Total recorded time across all sessions</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sessions Completed</Text>
        <Text style={styles.cardValue}>{summary.totalSessions}</Text>
        <Text style={styles.cardNote}>Total number of saved study sessions</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Average Focus</Text>
        <Text style={styles.cardValue}>{summary.averageFocus} / 5</Text>
        <Text style={styles.cardNote}>Calculated from all recorded sessions</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Best Environment</Text>
        <Text style={styles.cardValueSmall}>{summary.bestEnvironment}</Text>
        <Text style={styles.cardNote}>Highest average focus score</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Most Recent Location</Text>
        <Text style={styles.cardValueSmall}>{summary.recentLocation}</Text>
        <Text style={styles.cardNote}>Latest saved study location</Text>
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

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={loadHomeData}
      >
        <Text style={styles.secondaryButtonText}>Refresh Dashboard</Text>
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
  cardValueSmall: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 4,
  },
  cardNote: {
    fontSize: 13,
    color: "#888",
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