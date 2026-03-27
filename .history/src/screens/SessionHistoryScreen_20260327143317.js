import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { auth } from "../../firebase";
import { getUserSessionsFromFirestore } from "../services/sessionService";

export default function SessionHistoryScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);

      if (!auth.currentUser) {
        setSessions([]);
        return;
      }

      const fetchedSessions = await getUserSessionsFromFirestore(auth.currentUser.uid);
      setSessions(fetchedSessions);
    } catch (error) {
      console.log("Error loading session history:", error);
      Alert.alert("Error", "Could not load session history.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "Unknown date";
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const formatDuration = (minutes) => {
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
        <Text style={styles.loadingText}>Loading session history...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Session History</Text>
      <Text style={styles.subtitle}>
        Review your past study sessions and recorded study environments.
      </Text>

      <TouchableOpacity style={styles.refreshButton} onPress={loadSessions}>
        <Text style={styles.refreshButtonText}>Refresh History</Text>
      </TouchableOpacity>

      {sessions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptyText}>
            Complete a study session to see your session history here.
          </Text>
        </View>
      ) : (
        sessions.map((session) => (
          <View key={session.id} style={styles.card}>
            <Text style={styles.cardTitle}>
              {session.locationName || "Unknown Location"}
            </Text>

            <Text style={styles.cardText}>
              Date: {formatDateTime(session.endedAt)}
            </Text>
            <Text style={styles.cardText}>
              Duration: {formatDuration(session.durationMinutes)}
            </Text>
            <Text style={styles.cardText}>
              Focus Rating: {session.focusRating ?? "N/A"} / 5
            </Text>
            <Text style={styles.cardText}>
              Distractions: {session.distractions ?? 0}
            </Text>
            <Text style={styles.cardText}>
              Goal Met: {session.goalMet ? "Yes" : "No"}
            </Text>
          </View>
        ))
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
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 10,
  },
  cardText: {
    fontSize: 15,
    color: "#333",
    marginBottom: 6,
  },
});