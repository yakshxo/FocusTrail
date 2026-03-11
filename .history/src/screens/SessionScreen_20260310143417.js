import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { auth } from "../../firebase";
import { saveStudySessionToFirestore } from "../services/sessionService";

const ACTIVE_SESSION_KEY = "activeStudySession";
const SAVED_SESSIONS_KEY = "savedStudySessions";

export default function SessionScreen() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [focusRating, setFocusRating] = useState("");
  const [distractions, setDistractions] = useState("");
  const [goalMet, setGoalMet] = useState(null);
  const [locationName, setLocationName] = useState("Fetching location...");
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    loadSavedSession();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    let interval = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  useEffect(() => {
    saveSessionLocally();
  }, [seconds, isRunning, focusRating, distractions, goalMet, locationName, coords]);

  const formattedTime = useMemo(() => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  }, [seconds]);

  const loadSavedSession = async () => {
    try {
      const saved = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSeconds(parsed.seconds || 0);
        setIsRunning(parsed.isRunning || false);
        setFocusRating(parsed.focusRating || "");
        setDistractions(parsed.distractions || "");
        setGoalMet(parsed.goalMet ?? null);
        setLocationName(parsed.locationName || "Unknown location");
        setCoords(parsed.coords || null);
      }
    } catch (error) {
      console.log("Error loading saved session:", error);
    }
  };

  const saveSessionLocally = async () => {
    try {
      const sessionData = {
        seconds,
        isRunning,
        focusRating,
        distractions,
        goalMet,
        locationName,
        coords,
      };
      await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.log("Error saving session locally:", error);
    }
  };

  const clearSavedSession = async () => {
    try {
      await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch (error) {
      console.log("Error clearing saved session:", error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationName("Location permission denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCoords(location.coords);

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const readableLocation = `${place.name || ""} ${place.street || ""}, ${place.city || ""}`.trim();
        setLocationName(readableLocation || "Current location detected");
      } else {
        setLocationName("Current location detected");
      }
    } catch (error) {
      console.log("Location error:", error);
      setLocationName("Unable to fetch location");
    }
  };

  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    Alert.alert("Reset Session", "Are you sure you want to reset this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          setSeconds(0);
          setIsRunning(false);
          setFocusRating("");
          setDistractions("");
          setGoalMet(null);
          await clearSavedSession();
        },
      },
    ]);
  };

  const handleEndSession = async () => {
    if (!focusRating || goalMet === null) {
      Alert.alert(
        "Incomplete Session",
        "Please enter a focus rating and select whether your goal was met."
      );
      return;
    }

    setIsRunning(false);

    const sessionSummary = {
      durationInSeconds: seconds,
      durationMinutes: Math.floor(seconds / 60),
      focusRating: Number(focusRating),
      distractions: Number(distractions || 0),
      goalMet,
      locationName,
      coords,
      environment: locationName,
      endedAt: new Date().toISOString(),
    };

    console.log("Session summary to save:", sessionSummary);
    console.log("Authenticated user object:", auth.currentUser);

    try {
      const existingSessions = await AsyncStorage.getItem(SAVED_SESSIONS_KEY);
      const parsedSessions = existingSessions ? JSON.parse(existingSessions) : [];
      const updatedSessions = [...parsedSessions, sessionSummary];

      await AsyncStorage.setItem(
        SAVED_SESSIONS_KEY,
        JSON.stringify(updatedSessions)
      );

      console.log("Saved session to AsyncStorage successfully");

      if (auth.currentUser && auth.currentUser.uid) {
        console.log("Attempting Firestore save for user:", auth.currentUser.uid);

        const firestoreDocId = await saveStudySessionToFirestore(
          auth.currentUser.uid,
          sessionSummary
        );

        console.log("Firestore save successful. Document ID:", firestoreDocId);
      } else {
        console.log("No authenticated user found. Firestore save skipped.");
      }

      await clearSavedSession();

      Alert.alert(
        "Session Ended",
        `Your session has been saved.\n\nTime: ${formattedTime}\nLocation: ${locationName}`
      );

      setSeconds(0);
      setFocusRating("");
      setDistractions("");
      setGoalMet(null);
      setCoords(null);
      getCurrentLocation();
    } catch (error) {
      console.log("Error saving completed session:", error);
      Alert.alert("Error", `Could not save session: ${error.message}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Study Session</Text>

      <View style={styles.timerCard}>
        <Text style={styles.timerLabel}>Session Timer</Text>
        <Text style={styles.timer}>{formattedTime}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleStartPause}>
          <Text style={styles.primaryButtonText}>
            {isRunning ? "Pause" : "Start"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
          <Text style={styles.secondaryButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Current Environment</Text>
        <Text style={styles.infoText}>{locationName}</Text>
        {coords && (
          <Text style={styles.subInfo}>
            Lat: {coords.latitude.toFixed(4)} | Lng: {coords.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Session Reflection</Text>

        <Text style={styles.label}>Focus Rating (1-5)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter focus rating"
          keyboardType="numeric"
          value={focusRating}
          onChangeText={setFocusRating}
          maxLength={1}
        />

        <Text style={styles.label}>Distractions</Text>
        <TextInput
          style={styles.input}
          placeholder="How many distractions?"
          keyboardType="numeric"
          value={distractions}
          onChangeText={setDistractions}
        />

        <Text style={styles.label}>Was your goal met?</Text>
        <View style={styles.goalRow}>
          <TouchableOpacity
            style={[
              styles.goalButton,
              goalMet === true && styles.selectedGoalButton,
            ]}
            onPress={() => setGoalMet(true)}
          >
            <Text
              style={[
                styles.goalButtonText,
                goalMet === true && styles.selectedGoalButtonText,
              ]}
            >
              Yes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.goalButton,
              goalMet === false && styles.selectedGoalButton,
            ]}
            onPress={() => setGoalMet(false)}
          >
            <Text
              style={[
                styles.goalButtonText,
                goalMet === false && styles.selectedGoalButtonText,
              ]}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
        <Text style={styles.endButtonText}>End Session</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#f7f8fa",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 20,
    color: "#111",
  },
  timerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    alignItems: "center",
  },
  timerLabel: {
    fontSize: 15,
    color: "#666",
    marginBottom: 8,
  },
  timer: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#111",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#2e6ef7",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d9d9d9",
  },
  secondaryButtonText: {
    color: "#222",
    fontWeight: "600",
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
    color: "#111",
  },
  infoText: {
    fontSize: 15,
    color: "#333",
    marginBottom: 6,
  },
  subInfo: {
    fontSize: 13,
    color: "#888",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  goalRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  goalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedGoalButton: {
    backgroundColor: "#2e6ef7",
    borderColor: "#2e6ef7",
  },
  goalButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  selectedGoalButtonText: {
    color: "#fff",
  },
  endButton: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  endButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});