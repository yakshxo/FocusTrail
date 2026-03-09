import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

export default function MapScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const [studySpots, setStudySpots] = useState([
    {
      id: "1",
      title: "Killam Library",
      description: "Quiet study environment",
      latitude: 44.6376,
      longitude: -63.5925,
    },
    {
      id: "2",
      title: "Student Union Building",
      description: "Good for group study",
      latitude: 44.6388,
      longitude: -63.5786,
    },
    {
      id: "3",
      title: "Tims Study Spot",
      description: "Cafe-style study space",
      latitude: 44.6463,
      longitude: -63.5737,
    },
  ]);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to show your position on the map."
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.log("Location error:", error);
      Alert.alert("Error", "Unable to fetch your location.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2e6ef7" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Location unavailable.</Text>
        <Text style={styles.subText}>
          Please enable location permissions and try again.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Study Map</Text>
      <Text style={styles.subtitle}>
        View your current location and nearby study spots.
      </Text>

      <MapView style={styles.map} initialRegion={userLocation} showsUserLocation>
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="You are here"
          description="Your current location"
          pinColor="blue"
        />

        {studySpots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{
              latitude: spot.latitude,
              longitude: spot.longitude,
            }}
            title={spot.title}
            description={spot.description}
          />
        ))}
      </MapView>

      <View style={styles.legendBox}>
        <Text style={styles.legendTitle}>Nearby Study Spots</Text>
        {studySpots.map((spot) => (
          <Text key={spot.id} style={styles.legendItem}>
            • {spot.title}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f8fa",
    paddingTop: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111",
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  map: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  legendBox: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111",
  },
  legendItem: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f8fa",
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: "#666",
  },
  errorText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 8,
  },
  subText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },
});