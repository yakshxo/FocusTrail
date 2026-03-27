import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { auth } from "../../firebase";
import { getUserSessionsFromFirestore } from "../services/sessionService";
import { getRandomQuote } from "../utils/quotes";

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState("");
  const [summary, setSummary] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    averageFocus: 0,
    bestEnvironment: "No data yet",
    recentLocation: "No sessions yet",
  });

  useEffect(() => {
    setQuote(getRandomQuote()); // 🎯 random quote on load
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      if (!auth.currentUser) return;

      const sessions = await getUserSessionsFromFirestore(auth.currentUser.uid);

      if (!sessions.length) return;

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
        const env = session.environment || session.locationName || "Unknown";

        if (!environmentScores[env]) {
          environmentScores[env] = { total: 0, count: 0 };
        }

        environmentScores[env].total += session.focusRating || 0;
        environmentScores[env].count += 1;
      });

      let bestEnvironment = "No data yet";
      let bestScore = -1;

      Object.keys(environmentScores).forEach((env) => {
        const avg =
          environmentScores[env].total /
          environmentScores[env].count;

        if (avg > bestScore) {
          bestScore = avg;
          bestEnvironment = env;
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

    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    return remaining === 0
      ? `${hours} hr`
      : `${hours} hr ${remaining} min`;
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

      {/*  Motivational Quote */}
    <View style={styles.quoteContainer}>
    <Text style={styles.quoteMark}>“</Text>
    <Text style={styles.quoteText}>{quote}</Text>
    <View style={styles.quoteDivider} />
    </View>

      <Text style={styles.subheading}>
        Track your study sessions and discover what helps you focus best.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Study Time</Text>
        <Text style={styles.cardValue}>
          {formatMinutes(summary.totalMinutes)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sessions Completed</Text>
        <Text style={styles.cardValue}>{summary.totalSessions}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Average Focus</Text>
        <Text style={styles.cardValue}>{summary.averageFocus} / 5</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Best Environment</Text>
        <Text style={styles.cardValueSmall}>
          {summary.bestEnvironment}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Most Recent Location</Text>
        <Text style={styles.cardValueSmall}>
          {summary.recentLocation}
        </Text>
      </View>
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
    marginBottom: 12,
    color: "#111",
  },
  subheading: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },

  quoteContainer: {
  marginBottom: 20,
  paddingVertical: 10,
  paddingHorizontal: 6,
  alignItems: "center",
},

quoteMark: {
  fontSize: 40,
  color: "#2e6ef7",
  opacity: 0.2,
  marginBottom: -10,
},

quoteText: {
  fontSize: 16,
  fontStyle: "italic",
  color: "#333",
  textAlign: "center",
  lineHeight: 24,
  paddingHorizontal: 10,
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
  },
  cardValueSmall: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
});