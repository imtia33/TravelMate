import { getCurrentUser } from "./appwrite";

const BASE_URL = "https://nominatim.openstreetmap.org/search";

const HEADERS = {
  "User-Agent": "TravelMate/1.0",
  "Accept": "application/json",
  "Accept-Language": "en"
};

const fetchHealthPlaces = async (type, viewbox) => {
  const url =
    `${BASE_URL}?` +
    `format=json&` +
    `amenity=${type}&` +
    `bounded=1&` +
    `accept-language=en&` +
    `limit=25&` +
    `viewbox=${viewbox}`;

  try {
    const res = await fetch(url, { headers: HEADERS });
    const data = await res.json();

    return data.map(p => ({
      id: p.place_id,
      Name: p.display_name.split(",")[0],
      lat: Number(p.lat),
      lon: Number(p.lon),
      Location: p.display_name,
      type
    }));
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    return [];
  }
};

export const getHealthcarePlaces = async (bbox) => {
  try {
    // Use user's bbox or default to Chittagong bbox
    const viewbox = bbox || "91.70,22.20,91.90,22.50";
    
    // Fetch hospitals and doctors
    const hospitals = await fetchHealthPlaces("hospital", viewbox);
    const doctors = await fetchHealthPlaces("doctors", viewbox);
    
    // Combine and return the results
    return [...hospitals, ...doctors];
  } catch (error) {
    console.error("Error fetching healthcare places:", error);
    return [];
  }
};