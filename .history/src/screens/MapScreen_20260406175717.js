import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { addFavorite } from "../services/favoritesService";

export default function MapScreen() {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState("Fetching location...");
  const [loading, setLoading] = useState(true);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [savedStudyMarkers, setSavedStudyMarkers] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchLocationAndData();
  }, []);

  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  };

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
        const readableLocation = `${place.city || ""}, ${place.region || ""}, ${
          place.country || ""
        }`.trim();
        setLocationLabel(readableLocation || "Current location");
      } else {
        setLocationLabel("Current location");
      }

      const fetchedPlaces = await fetchNearbyStudyPlaces(
        location.coords.latitude,
        location.coords.longitude
      );

      const sortedPlaces = fetchedPlaces
        .map((spot) => ({
          ...spot,
          distanceKm: calculateDistanceKm(
            location.coords.latitude,
            location.coords.longitude,
            spot.latitude,
            spot.longitude
          ),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);

      setNearbyPlaces(sortedPlaces);

      if (auth.currentUser) {
  // LOAD FAVORITES
  const favs = await getFavorites(auth.currentUser.uid);
  setFavorites(favs);

  const sessions = await getUserSessionsFromFirestore(auth.currentUser.uid);

        const uniqueMarkers = sessions
          .filter(
            (session) => session.coords?.latitude && session.coords?.longitude
          )
          .reduce((acc, session) => {
            const key = `${session.coords.latitude.toFixed(
              4
            )}-${session.coords.longitude.toFixed(4)}`;

            if (!acc.find((item) => item.key === key)) {
              const distanceKm = calculateDistanceKm(
                location.coords.latitude,
                location.coords.longitude,
                session.coords.latitude,
                session.coords.longitude
              );

              acc.push({
                key,
                title: session.locationName || "Saved Study Session",
                description: `Focus: ${session.focusRating || "N/A"}`,
                latitude: session.coords.latitude,
                longitude: session.coords.longitude,
                distanceKm,
              });
            }

            return acc;
          }, [])
          .sort((a, b) => a.distanceKm - b.distanceKm);

        setSavedStudyMarkers(uniqueMarkers);
      }

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion(currentRegion, 1000);
        }
      }, 300);
    } catch (error) {
      console.log("Map location/API error:", error);
      Alert.alert("Error", "Unable to fetch map data.");
    } finally {
      setLoading(false);
    }
  };

  const focusOnPlace = (place) => {
    if (!mapRef.current) return;

    mapRef.current.animateToRegion(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      800
    );
  };

  const openAppleMaps = async (place) => {
  try {
    const url = `http://maps.apple.com/?daddr=${place.latitude},${place.longitude}&dirflg=w`;
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert("Error", "Could not open Apple Maps.");
  }
};

const openGoogleMaps = async (place) => {
  const iosUrl = `comgooglemaps://?daddr=${place.latitude},${place.longitude}&directionsmode=walking`;
  const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

  try {
    if (Platform.OS === "ios") {
      try {
        await Linking.openURL(iosUrl);
      } catch (error) {
        await Linking.openURL(webFallback);
      }
      return;
    }

    const androidGeoUrl = `geo:0,0?q=${place.latitude},${place.longitude}(${encodeURIComponent(
      place.title
    )})`;

    try {
      await Linking.openURL(androidGeoUrl);
    } catch (error) {
      await Linking.openURL(webFallback);
    }
  } catch (error) {
    Alert.alert("Error", "Could not open Google Maps.");
  }
};

const handlePlacePress = async (place) => {
  focusOnPlace(place);

  Alert.alert(place.title, "Choose an action", [
  {
    text: "View Details",
    onPress: () => navigation.navigate("PlaceDetails", { place }),
  },
  {
    text: "Navigate",
    onPress: async () => {
      if (Platform.OS === "ios") {
        Alert.alert("Navigation", "Choose an app", [
          { text: "Apple Maps", onPress: () => openAppleMaps(place) },
          { text: "Google Maps", onPress: () => openGoogleMaps(place) },
          { text: "Cancel", style: "cancel" },
        ]);
      } else {
        await openGoogleMaps(place);
      }
    },
  },
  {
    text: "Add to Favorites ❤️",
    onPress: async () => {
      await addFavorite(auth.currentUser.uid, place);
      const updatedFavs = await getFavorites(auth.currentUser.uid);
      setFavorites(updatedFavs); // 🔥 refresh UI instantly
      Alert.alert("Saved", "Added to favorites");
    },
  },
  {
    text: "Cancel",
    style: "cancel",
  },
]);
};

  const formatDistance = (distanceKm) => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  };

  const sortedSavedMarkers = useMemo(() => {
    return [...savedStudyMarkers].sort((a, b) => a.distanceKm - b.distanceKm);
  }, [savedStudyMarkers]);

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
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchLocationAndData}
        >
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
            description={`${spot.description} • ${formatDistance(
              spot.distanceKm
            )}`}
            pinColor="green"
            onPress={() => focusOnPlace(spot)}
          />
        ))}

        {sortedSavedMarkers.map((spot) => (
          <Marker
            key={spot.key}
            coordinate={{
              latitude: spot.latitude,
              longitude: spot.longitude,
            }}
            title={spot.title}
            description={`${spot.description} • ${formatDistance(
              spot.distanceKm
            )}`}
            pinColor="red"
            onPress={() => focusOnPlace(spot)}
          />
        ))}
      </MapView>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Current Detected Location</Text>
        <Text style={styles.infoText}>{locationLabel}</Text>
        <Text style={styles.coordText}>
          Lat: {userLocation.latitude.toFixed(4)} | Lng:{" "}
          {userLocation.longitude.toFixed(4)}
        </Text>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchLocationAndData}
        >
          <Text style={styles.refreshButtonText}>Refresh Map Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Nearby Study Places</Text>
        {nearbyPlaces.length > 0 ? (
          nearbyPlaces.map((spot) => (

  <View key={spot.id} style={styles.placeRow}>
  
  <TouchableOpacity
    style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
    onPress={() => handlePlacePress(spot)}
  >
    <View style={{ flex: 1 }}>
      <Text style={styles.placeTitle}>{spot.title}</Text>
      <Text style={styles.placeDescription}>
        {spot.description} • {formatDistance(spot.distanceKm)}
      </Text>
    </View>

    {/* ❤️ SHOW ONLY IF FAVORITED */}
    {favorites.some((f) => f.placeId === spot.id) && (
      <Text style={styles.favoriteText}>❤️</Text>
    )}

  </TouchableOpacity>

</View>
))
        ) : (
          <Text style={styles.spotItem}>No nearby places found.</Text>
        )}
      </View>

      <View style={styles.infoCard}>
  <Text style={styles.infoTitle}>Saved Study Location Markers</Text>

  {sortedSavedMarkers.length > 0 ? (
    sortedSavedMarkers.map((spot) => (
      <View key={spot.key} style={styles.placeRow}>

        {/* LEFT SIDE (clickable) */}
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => handlePlacePress(spot)}
        >
          <View style={styles.placeTextWrap}>
            <Text style={styles.placeTitle}>{spot.title}</Text>
            <Text style={styles.placeDescription}>
              {spot.description} • {formatDistance(spot.distanceKm)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* RIGHT SIDE (favorite button) */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={async () => {
            await addFavorite(auth.currentUser.uid, spot);
            Alert.alert("Saved ❤️", "Added to favorites");
          }}
        >
          <Text style={styles.favoriteText}>❤️</Text>
        </TouchableOpacity>

      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 12,
  },
  placeTextWrap: {
    flex: 1,
  },
  placeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    marginBottom: 2,
  },
  placeDescription: {
    fontSize: 13,
    color: "#777",
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
  favoriteButton: {
  paddingHorizontal: 10,
  justifyContent: "center",
},

favoriteText: {
  fontSize: 20,
},
});