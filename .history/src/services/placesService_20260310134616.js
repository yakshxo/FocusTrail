const MOCK_STUDY_PLACES = [
    {
      id: "mock-1",
      title: "Killam Library",
      description: "Library",
      latitude: 44.6376,
      longitude: -63.5925,
    },
    {
      id: "mock-2",
      title: "Halifax Central Library",
      description: "Library",
      latitude: 44.6445,
      longitude: -63.5746,
    },
    {
      id: "mock-3",
      title: "Tim Hortons",
      description: "Cafe",
      latitude: 44.6488,
      longitude: -63.5752,
    },
    {
      id: "mock-4",
      title: "Dalhousie SUB",
      description: "Campus study space",
      latitude: 44.6388,
      longitude: -63.5786,
    },
  ];
  
  function mapOverpassResults(data) {
    return (data.elements || [])
      .map((item, index) => {
        const lat = item.lat || item.center?.lat;
        const lon = item.lon || item.center?.lon;
  
        if (!lat || !lon) return null;
  
        return {
          id: `place-${item.id || index}`,
          title: item.tags?.name || item.tags?.amenity || "Study Spot",
          description: item.tags?.amenity || "Nearby study place",
          latitude: lat,
          longitude: lon,
        };
      })
      .filter(Boolean)
      .slice(0, 10);
  }
  
async function fetchFromEndpoint(endpoint, query) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      const places = mapOverpassResults(data);
      if (places.length === 0) throw new Error("No results");
      return places;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  async function tryOverpass(latitude, longitude, radius) {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="library"](around:${radius},${latitude},${longitude});
        node["amenity"="cafe"](around:${radius},${latitude},${longitude});
        node["amenity"="university"](around:${radius},${latitude},${longitude});
      );
      out body;
    `.trim();
  
    const endpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
      "https://overpass.openstreetmap.ru/api/interpreter",
    ];
  
    try {
      return await Promise.any(endpoints.map((ep) => fetchFromEndpoint(ep, query)));
    } catch {
      console.log("All Overpass endpoints failed. Using fallback.");
      return [];
    }
  }
  
  export async function fetchNearbyStudyPlaces(latitude, longitude) {
    const results = await tryOverpass(latitude, longitude, 1000);
  
    if (results.length > 0) {
      return results;
    }
  
    console.log("Using fallback mock study places.");
    return MOCK_STUDY_PLACES;
  }