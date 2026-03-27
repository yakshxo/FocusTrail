const API_KEY = "d18b91c9ec4b4ba5b5249dc23ac34be6";

export async function fetchNearbyStudyPlaces(latitude, longitude) {
  try {
    const url = `https://api.geoapify.com/v2/places?categories=catering.cafe,education.library,education.university&filter=circle:${longitude},${latitude},2000&limit=10&apiKey=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Geoapify API failed");
    }

    const data = await response.json();

    const places = (data.features || []).map((item, index) => ({
      id: item.properties.place_id || `geo-${index}`,
      title: item.properties.name || "Study Spot",
      description: item.properties.categories?.[0] || "Nearby place",
      latitude: item.geometry.coordinates[1],
      longitude: item.geometry.coordinates[0],
    }));

    return places;
  } catch (error) {
    console.log("Geoapify error:", error);

    // fallback if API fails
    return [
      {
        id: "fallback-1",
        title: "Nearby Library",
        description: "Fallback location",
        latitude: latitude + 0.002,
        longitude: longitude + 0.001,
      },
      {
        id: "fallback-2",
        title: "Nearby Cafe",
        description: "Fallback location",
        latitude: latitude - 0.001,
        longitude: longitude + 0.002,
      },
    ];
  }
}