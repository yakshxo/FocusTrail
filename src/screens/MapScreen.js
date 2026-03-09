import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { auth } from "../../firebase";
import { fetchNearbyStudyPlaces } from "../services/placesService";
import { getUserSessionsFromFirestore } from "../services/sessionService";

export default function MapScreen() {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState("Fetching location...");
  const [loading, setLoading] = useState(true);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [savedStudyMarkers, setSavedStudyMarkers] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    fetchLocationAndData();
  }, []);

  const fetchLocationAndData = async () => {
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
        accuracy: Location.Accuracy.Balanced,
      });

      const currentRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      // Show the map immediately — don't wait for places/sessions
      setUserLocation(currentRegion);
      setLoading(false);

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion(currentRegion, 1000);
        }
      }, 300);

      // Load everything else in parallel in the background
      const [reverseGeocode, fetchedPlaces, sessions] = await Promise.allSettled([
        Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }),
        fetchNearbyStudyPlaces(location.coords.latitude, location.coords.longitude),
        auth.currentUser
          ? getUserSessionsFromFirestore(auth.currentUser.uid)
          : Promise.resolve([]),
      ]);

      if (reverseGeocode.status === "fulfilled" && reverseGeocode.value.length > 0) {
        const place = reverseGeocode.value[0];
        const readableLocation = `${place.city || ""}, ${place.region || ""}, ${place.country || ""}`.trim();
        setLocationLabel(readableLocation || "Current location");
      } else {
        setLocationLabel("Current location");
      }

      if (fetchedPlaces.status === "fulfilled") {
        setNearbyPlaces(fetchedPlaces.value);
      }

      if (sessions.status === "fulfilled") {
        const uniqueMarkers = sessions.value
          .filter((session) => session.coords?.latitude && session.coords?.longitude)
          .reduce((acc, session) => {
            const key = `${session.coords.latitude.toFixed(4)}-${session.coords.longitude.toFixed(4)}`;
            if (!acc.find((item) => item.key === key)) {
              acc.push({
                key,
                title: session.locationName || "Saved Study Session",
                description: `Focus: ${session.focusRating || "N/A"}`,
                latitude: session.coords.latitude,
                longitude: session.coords.longitude,
              });
            }
            return acc;
          }, []);
        setSavedStudyMarkers(uniqueMarkers);
      }
    } catch (error) {
      console.log("Map location/API error:", error);
      Alert.alert("Error", "Unable to fetch map data.");
      setLoading(false);
    }
  };

  const handleNavigate = async () => {
    if (!selectedPlace) {
      Alert.alert("No Place Selected", "Please select a study place first.");
      return;
    }

    const { latitude, longitude, title } = selectedPlace;

    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=w`
        : `google.navigation:q=${latitude},${longitude}`;

    const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(webFallback);
      }
    } catch (error) {
      console.log("Navigation error:", error);
      Alert.alert("Navigation Error", `Could not open directions to ${title}.`);
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
        <TouchableOpacity style={styles.refreshButton} onPress={fetchLocationAndData}>
          <Text style={styles.refreshButtonText}>Retry Location</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Study Map</Text>
      <Text style={styles.subtitle}>
        View your live location, nearby study spots, and saved study markers.
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

        {nearbyPlaces.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{
              latitude: spot.latitude,
              longitude: spot.longitude,
            }}
            title={spot.title}
            description={spot.description}
            pinColor="green"
            onPress={() => setSelectedPlace(spot)}
          />
        ))}

        {savedStudyMarkers.map((spot) => (
          <Marker
            key={spot.key}
            coordinate={{
              latitude: spot.latitude,
              longitude: spot.longitude,
            }}
            title={spot.title}
            description={spot.description}
            pinColor="red"
            onPress={() => setSelectedPlace(spot)}
          />
        ))}
      </MapView>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Current Detected Location</Text>
        <Text style={styles.infoText}>{locationLabel}</Text>
        <Text style={styles.coordText}>
          Lat: {userLocation.latitude.toFixed(4)} | Lng: {userLocation.longitude.toFixed(4)}
        </Text>

        <TouchableOpacity style={styles.refreshButton} onPress={fetchLocationAndData}>
          <Text style={styles.refreshButtonText}>Refresh Map Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Selected Place</Text>
        {selectedPlace ? (
          <>
            <Text style={styles.infoText}>{selectedPlace.title}</Text>
            <Text style={styles.spotItem}>{selectedPlace.description}</Text>

            <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
              <Text style={styles.navigateButtonText}>Navigate to Place</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.spotItem}>
            Tap a marker on the map to view details and navigate.
          </Text>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Nearby Study Places</Text>
        {nearbyPlaces.length > 0 ? (
          nearbyPlaces.map((spot) => (
            <TouchableOpacity
              key={spot.id}
              onPress={() => setSelectedPlace(spot)}
              style={styles.placeRow}
            >
              <Text style={styles.spotItem}>• {spot.title}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.spotItem}>No nearby places found.</Text>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Saved Study Location Markers</Text>
        {savedStudyMarkers.length > 0 ? (
          savedStudyMarkers.map((spot) => (
            <TouchableOpacity
              key={spot.key}
              onPress={() => setSelectedPlace(spot)}
              style={styles.placeRow}
            >
              <Text style={styles.spotItem}>• {spot.title}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.spotItem}>No saved study locations yet.</Text>
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
  placeRow: {
    paddingVertical: 4,
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
  navigateButton: {
    backgroundColor: "#111",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 10,
  },
  navigateButtonText: {
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