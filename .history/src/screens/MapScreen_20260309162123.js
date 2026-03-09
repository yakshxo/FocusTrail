import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

export default function MapScreen() {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState("Fetching location...");
  const [loading, setLoading] = useState(true);

  const [studySpots] = useState([
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
      title: "Halifax Central Library",
      description: "Strong individual study spot",
      latitude: 44.6445,
      longitude: -63.5746,
    },
  ]);

  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to display your current location."
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const currentRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setUserLocation(currentRegion);

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const readableLocation = `${place.city || ""}, ${place.region || ""}, ${place.country || ""}`.trim();
        setLocationLabel(readableLocation || "Current location");
      } else {
        setLocationLabel("Current location");
      }

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion(currentRegion, 1000);
        }
      }, 300);
    } catch (error) {
      console.log("Map location error:", error);
      Alert.alert("Error", "Unable to fetch your current location.");
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
        <Text style={styles.errorText}>Location unavailable</Text>
        <Text style={styles.subText}>
          Please enable location permissions and try refreshing.
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchLocation}>
          <Text style={styles.refreshButtonText}>Retry Location</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Study Map</Text>
      <Text style={styles.subtitle}>
        View your live location and nearby study spots.
      </Text>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={userLocation}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
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

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Current Detected Location</Text>
        <Text style={styles.infoText}>{locationLabel}</Text>
        <Text style={styles.coordText}>
          Lat: {userLocation.latitude.toFixed(4)} | Lng: {userLocation.longitude.toFixed(4)}
        </Text>

        <TouchableOpacity style={styles.refreshButton} onPress={fetchLocation}>
          <Text style={styles.refreshButtonText}>Refresh Location</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Nearby Study Spots</Text>
        {studySpots.map((spot) => (
          <Text key={spot.id} style={styles.spotItem}>
            • {spot.title}
          </Text>
        ))}
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
    marginBottom: 16,
    lineHeight: 22,
  },
  map: {
    width: "100%",
    height: 380,
    borderRadius: 16,
    marginBottom: 18,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    color: "#333",
    marginBottom: 6,
  },
  coordText: {
    fontSize: 13,
    color: "#888",
    marginBottom: 14,
  },
  spotItem: {
    fontSize: 15,
    color: "#333",
    marginBottom: 6,
  },
  refreshButton: {
    backgroundColor: "#2e6ef7",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 6,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
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
    marginBottom: 16,
  },
});