const API_KEY = "d18b91c9ec4b4ba5b5249dc23ac34be6";

function getReadableCategory(categories) {
  if (!categories || categories.length === 0) return "Study Spot";

  const category = categories[0];

  if (category.includes("cafe")) return "Cafe";
  if (category.includes("library")) return "Library";
  if (category.includes("university")) return "University";

  return "Study Spot";
}

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
      description: getReadableCategory(item.properties.categories),
      latitude: item.geometry.coordinates[1],
      longitude: item.geometry.coordinates[0],
    }));

    return places;
  } catch (error) {
    console.log("Geoapify error:", error);

    return [
      {
        id: "fallback-1",
        title: "Nearby Library",
        description: "Library",
        latitude: latitude + 0.002,
        longitude: longitude + 0.001,
      },
      {
        id: "fallback-2",
        title: "Nearby Cafe",
        description: "Cafe",
        latitude: latitude - 0.001,
        longitude: longitude + 0.002,
      },
      {
        id: "fallback-3",
        title: "Nearby University",
        description: "University",
        latitude: latitude + 0.0015,
        longitude: longitude - 0.0015,
      },
    ];
  }
}