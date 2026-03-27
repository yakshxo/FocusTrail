import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { auth } from "../../firebase";
import { getUserSessionsFromFirestore } from "../services/sessionService";

export default function StatsScreen() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    averageFocus: 0,
    bestEnvironment: "No data yet",
    goalCompletionRate: 0,
    averageSessionDuration: 0,
    highestFocusSession: null,
    lowestFocusSession: null,
    topLocations: [],
    recentSessions: [],
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      if (!auth.currentUser) {
        setSessions([]);
        return;
      }

      const fetchedSessions = await getUserSessionsFromFirestore(auth.currentUser.uid);
      setSessions(fetchedSessions);

      if (!fetchedSessions.length) {
        setStats({
          totalSessions: 0,
          totalMinutes: 0,
          averageFocus: 0,
          bestEnvironment: "No data yet",
          goalCompletionRate: 0,
          averageSessionDuration: 0,
          highestFocusSession: null,
          lowestFocusSession: null,
          topLocations: [],
          recentSessions: [],
        });
        return;
      }

      const totalSessions = fetchedSessions.length;

      const totalMinutes = fetchedSessions.reduce(
        (sum, session) => sum + (session.durationMinutes || 0),
        0
      );

      const averageFocus =
        fetchedSessions.reduce(
          (sum, session) => sum + (session.focusRating || 0),
          0
        ) / totalSessions;

      const goalMetCount = fetchedSessions.filter(
        (session) => session.goalMet === true
      ).length;

      const goalCompletionRate = (goalMetCount / totalSessions) * 100;

      const averageSessionDuration = totalMinutes / totalSessions;

      const environmentScores = {};
      fetchedSessions.forEach((session) => {
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

      const sortedByFocus = [...fetchedSessions].sort(
        (a, b) => (b.focusRating || 0) - (a.focusRating || 0)
      );

      const highestFocusSession = sortedByFocus[0];
      const lowestFocusSession = sortedByFocus[sortedByFocus.length - 1];

      const locationCounts = {};
      fetchedSessions.forEach((session) => {
        const location = session.locationName || "Unknown";
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      });

      const topLocations = Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const recentSessions = fetchedSessions.slice(0, 3);

      setStats({
        totalSessions,
        totalMinutes,
        averageFocus: Number(averageFocus.toFixed(1)),
        bestEnvironment,
        goalCompletionRate: Number(goalCompletionRate.toFixed(1)),
        averageSessionDuration: Number(averageSessionDuration.toFixed(1)),
        highestFocusSession,
        lowestFocusSession,
        topLocations,
        recentSessions,
      });
    } catch (error) {
      console.log("Error loading stats:", error);
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
    const remainingMinutes = Math.round(minutes % 60);

    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Unknown date";
    return new Date(isoString).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2e6ef7" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Stats & Insights</Text>
      <Text style={styles.subtitle}>
        A deeper look into your study patterns, focus, and session outcomes.
      </Text>

      <TouchableOpacity style={styles.refreshButton} onPress={loadStats}>
        <Text style={styles.refreshButtonText}>Refresh Analytics</Text>
      </TouchableOpacity>

      {sessions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No session data yet</Text>
          <Text style={styles.emptyText}>
            Complete a few study sessions to unlock your analytics and insights.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total Sessions</Text>
            <Text style={styles.cardValue}>{stats.totalSessions}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total Study Time</Text>
            <Text style={styles.cardValue}>{formatMinutes(stats.totalMinutes)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Average Focus</Text>
            <Text style={styles.cardValue}>{stats.averageFocus} / 5</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Best Environment</Text>
            <Text style={styles.cardValueSmall}>{stats.bestEnvironment}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Goal Completion Rate</Text>
            <Text style={styles.cardValue}>{stats.goalCompletionRate}%</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Average Session Duration</Text>
            <Text style={styles.cardValue}>
              {formatMinutes(stats.averageSessionDuration)}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Top Locations</Text>
            {stats.topLocations.length > 0 ? (
              stats.topLocations.map(([location, count], index) => (
                <Text key={index} style={styles.listItem}>
                  {index + 1}. {location} ({count} session{count > 1 ? "s" : ""})
                </Text>
              ))
            ) : (
              <Text style={styles.emptyInline}>No locations yet.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Highest Focus Session</Text>
            {stats.highestFocusSession ? (
              <>
                <Text style={styles.listItem}>
                  Location: {stats.highestFocusSession.locationName || "Unknown"}
                </Text>
                <Text style={styles.listItem}>
                  Focus: {stats.highestFocusSession.focusRating} / 5
                </Text>
                <Text style={styles.listItem}>
                  Duration: {formatMinutes(stats.highestFocusSession.durationMinutes)}
                </Text>
              </>
            ) : (
              <Text style={styles.emptyInline}>No data yet.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Lowest Focus Session</Text>
            {stats.lowestFocusSession ? (
              <>
                <Text style={styles.listItem}>
                  Location: {stats.lowestFocusSession.locationName || "Unknown"}
                </Text>
                <Text style={styles.listItem}>
                  Focus: {stats.lowestFocusSession.focusRating} / 5
                </Text>
                <Text style={styles.listItem}>
                  Duration: {formatMinutes(stats.lowestFocusSession.durationMinutes)}
                </Text>
              </>
            ) : (
              <Text style={styles.emptyInline}>No data yet.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Recent Sessions</Text>
            {stats.recentSessions.length > 0 ? (
              stats.recentSessions.map((session, index) => (
                <View key={index} style={styles.sessionRow}>
                  <Text style={styles.listItem}>
                    {session.locationName || "Unknown Location"}
                  </Text>
                  <Text style={styles.sessionSubtext}>
                    {formatDate(session.endedAt)} • {formatMinutes(session.durationMinutes)} • Focus{" "}
                    {session.focusRating}/5
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyInline}>No recent sessions.</Text>
            )}
          </View>
        </>
      )}
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
    marginBottom: 18,
    lineHeight: 22,
  },
  refreshButton: {
    backgroundColor: "#2e6ef7",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 18,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
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
  cardValueSmall: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
  listItem: {
    fontSize: 15,
    color: "#333",
    marginBottom: 6,
  },
  emptyInline: {
    fontSize: 15,
    color: "#888",
    fontStyle: "italic",
  },
  sessionRow: {
    marginBottom: 10,
  },
  sessionSubtext: {
    fontSize: 13,
    color: "#777",
  },
});