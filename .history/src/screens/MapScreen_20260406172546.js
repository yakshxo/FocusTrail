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

  useEffect(() => {
    fetchLocationAndData();
  }, []);

  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const fetchLocationAndData = async () => {
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setUserLocation(region);

      const reverse = await Location.reverseGeocodeAsync(region);
      if (reverse.length > 0) {
        const p = reverse[0];
        setLocationLabel(`${p.city || ""}, ${p.region || ""}`);
      }

      const places = await fetchNearbyStudyPlaces(
        region.latitude,
        region.longitude
      );

      const sorted = places
        .map((p) => ({
          ...p,
          distanceKm: calculateDistanceKm(
            region.latitude,
            region.longitude,
            p.latitude,
            p.longitude
          ),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);

      setNearbyPlaces(sorted);

      if (auth.currentUser) {
        const sessions = await getUserSessionsFromFirestore(
          auth.currentUser.uid
        );

        const markers = sessions
          .filter((s) => s.coords)
          .map((s) => ({
            key: `${s.coords.latitude}-${s.coords.longitude}`,
            id: `${s.coords.latitude}-${s.coords.longitude}`, // 🔥 important
            title: s.locationName || "Saved Session",
            description: `Focus: ${s.focusRating}`,
            latitude: s.coords.latitude,
            longitude: s.coords.longitude,
            distanceKm: calculateDistanceKm(
              region.latitude,
              region.longitude,
              s.coords.latitude,
              s.coords.longitude
            ),
          }));

        setSavedStudyMarkers(markers);
      }

      setTimeout(() => {
        mapRef.current?.animateToRegion(region, 1000);
      }, 300);
    } catch (e) {
      console.log(e);
      Alert.alert("Error loading map");
    } finally {
      setLoading(false);
    }
  };

  const handlePlacePress = (place) => {
    Alert.alert(place.title, "Choose action", [
      {
        text: "View Details",
        onPress: () => navigation.navigate("PlaceDetails", { place }),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const formatDistance = (d) =>
    d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;

  const sortedSavedMarkers = useMemo(
    () => [...savedStudyMarkers].sort((a, b) => a.distanceKm - b.distanceKm),
    [savedStudyMarkers]
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Study Map</Text>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={userLocation}
        showsUserLocation
      >
        {userLocation && (
          <Marker coordinate={userLocation} pinColor="blue" />
        )}

        {nearbyPlaces.map((p) => (
          <Marker
            key={p.id}
            coordinate={p}
            title={p.title}
            pinColor="green"
          />
        ))}
      </MapView>

      {/* Nearby */}
      <View style={styles.card}>
        <Text style={styles.section}>Nearby Places</Text>

        {nearbyPlaces.map((spot) => (
          <View key={spot.id} style={styles.row}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => handlePlacePress(spot)}
            >
              <Text style={styles.place}>{spot.title}</Text>
              <Text style={styles.desc}>
                {spot.description} • {formatDistance(spot.distanceKm)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                await addFavorite(auth.currentUser.uid, spot);
                Alert.alert("Saved ❤️");
              }}
            >
              <Text style={styles.heart}>❤️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Saved */}
      <View style={styles.card}>
        <Text style={styles.section}>Saved Locations</Text>

        {sortedSavedMarkers.map((spot) => (
          <View key={spot.key} style={styles.row}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => handlePlacePress(spot)}
            >
              <Text style={styles.place}>{spot.title}</Text>
              <Text style={styles.desc}>
                {spot.description} • {formatDistance(spot.distanceKm)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                await addFavorite(auth.currentUser.uid, spot);
                Alert.alert("Saved ❤️");
              }}
            >
              <Text style={styles.heart}>❤️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f7f8fa" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 10 },
  map: { height: 300, borderRadius: 12, marginBottom: 15 },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },

  section: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  place: { fontWeight: "600" },
  desc: { fontSize: 12, color: "#777" },

  heart: { fontSize: 20 },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});