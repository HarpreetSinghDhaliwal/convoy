import type { GeocodeResult } from "../types";

// Curated instant-matching Indian cities, hill stations, and hubs
// for zero-latency prefix search (e.g., "ch", "chandig", "mana", "kasol", "del")
const POPULAR_INDIAN_DESTINATIONS: GeocodeResult[] = [
  { label: "Chandigarh, India", lat: 30.7333, lng: 76.7794 },
  { label: "Sector 17, Chandigarh, India", lat: 30.7415, lng: 76.7791 },
  { label: "Sector 43 ISBT, Chandigarh, India", lat: 30.7183, lng: 76.7467 },
  { label: "Sector 35, Chandigarh, India", lat: 30.7247, lng: 76.7645 },
  { label: "Mohali (SAS Nagar), Punjab, India", lat: 30.7046, lng: 76.7179 },
  { label: "Panchkula, Haryana, India", lat: 30.6942, lng: 76.8606 },
  { label: "Zirakpur, Punjab, India", lat: 30.6425, lng: 76.8173 },
  { label: "Kharar, Punjab, India", lat: 30.7456, lng: 76.6483 },
  { label: "Manali, Himachal Pradesh, India", lat: 32.2432, lng: 77.1892 },
  { label: "Old Manali, Himachal Pradesh, India", lat: 32.2562, lng: 77.1772 },
  { label: "Kasol, Parvati Valley, Himachal Pradesh", lat: 32.0100, lng: 77.3150 },
  { label: "Tosh, Parvati Valley, Himachal Pradesh", lat: 32.0142, lng: 77.4526 },
  { label: "Shimla, Himachal Pradesh, India", lat: 31.1048, lng: 77.1734 },
  { label: "Dharamshala, Himachal Pradesh, India", lat: 32.2190, lng: 76.3234 },
  { label: "McLeod Ganj, Himachal Pradesh, India", lat: 32.2426, lng: 76.3213 },
  { label: "Bir Billing (Paragliding), Himachal Pradesh", lat: 32.0427, lng: 76.7186 },
  { label: "Jibhi, Tirthan Valley, Himachal Pradesh", lat: 31.6375, lng: 77.3486 },
  { label: "Spiti Valley (Kaza), Himachal Pradesh", lat: 32.2276, lng: 78.0710 },
  { label: "Kasauli, Himachal Pradesh, India", lat: 30.9013, lng: 76.9649 },
  { label: "Leh Ladakh, UT, India", lat: 34.1526, lng: 77.5771 },
  { label: "Delhi / NCR, India", lat: 28.6139, lng: 77.2090 },
  { label: "Connaught Place, New Delhi, India", lat: 28.6315, lng: 77.2167 },
  { label: "Gurgaon (Gurugram), Haryana, India", lat: 28.4595, lng: 77.0266 },
  { label: "Cyber Hub, Gurgaon, Haryana, India", lat: 28.4950, lng: 77.0890 },
  { label: "Noida, Uttar Pradesh, India", lat: 28.5355, lng: 77.3910 },
  { label: "Rishikesh, Uttarakhand, India", lat: 30.0869, lng: 78.2676 },
  { label: "Tapovan, Rishikesh, Uttarakhand", lat: 30.1340, lng: 78.3240 },
  { label: "Dehradun, Uttarakhand, India", lat: 30.3165, lng: 78.0322 },
  { label: "Mussoorie, Uttarakhand, India", lat: 30.4598, lng: 78.0644 },
  { label: "Nainital, Uttarakhand, India", lat: 29.3919, lng: 79.4542 },
  { label: "Haridwar, Uttarakhand, India", lat: 29.9457, lng: 78.1642 },
  { label: "Jaipur, Rajasthan, India", lat: 26.9124, lng: 75.7873 },
  { label: "Udaipur, Rajasthan, India", lat: 24.5854, lng: 73.7125 },
  { label: "Jodhpur, Rajasthan, India", lat: 26.2389, lng: 73.0243 },
  { label: "Jaisalmer, Rajasthan, India", lat: 26.9157, lng: 70.9083 },
  { label: "Pushkar, Rajasthan, India", lat: 26.4899, lng: 74.5511 },
  { label: "Goa (North / Calangute / Anjuna), India", lat: 15.5439, lng: 73.7553 },
  { label: "Goa (South / Palolem), India", lat: 15.0100, lng: 74.0232 },
  { label: "Mumbai, Maharashtra, India", lat: 19.0760, lng: 72.8777 },
  { label: "Bandra, Mumbai, Maharashtra, India", lat: 19.0596, lng: 72.8295 },
  { label: "Pune, Maharashtra, India", lat: 18.5204, lng: 73.8567 },
  { label: "Lonavala, Maharashtra, India", lat: 18.7557, lng: 73.4091 },
  { label: "Bangalore (Bengaluru), Karnataka, India", lat: 12.9716, lng: 77.5946 },
  { label: "Indiranagar, Bangalore, Karnataka, India", lat: 12.9784, lng: 77.6408 },
  { label: "Koramangala, Bangalore, Karnataka, India", lat: 12.9352, lng: 77.6245 },
  { label: "Hyderabad, Telangana, India", lat: 17.3850, lng: 78.4867 },
  { label: "Chennai, Tamil Nadu, India", lat: 13.0827, lng: 80.2707 },
  { label: "Kolkata, West Bengal, India", lat: 22.5726, lng: 88.3639 },
  { label: "Amritsar (Golden Temple), Punjab, India", lat: 31.6200, lng: 74.8765 },
  { label: "Ludhiana, Punjab, India", lat: 30.9010, lng: 75.8573 },
  { label: "Jalandhar, Punjab, India", lat: 31.3260, lng: 75.5762 },
  { label: "Agra (Taj Mahal), Uttar Pradesh, India", lat: 27.1751, lng: 78.0421 },
];

function formatPhotonFeature(f: any): GeocodeResult | null {
  const props = f?.properties;
  const geom = f?.geometry?.coordinates;
  if (!props || !geom || geom.length < 2) return null;

  const name = props.name || props.street || props.district || props.city || "";
  if (!name) return null;

  const parts = [
    name,
    props.district && props.district !== name ? props.district : null,
    props.city && props.city !== name ? props.city : null,
    props.state && props.state !== name ? props.state : null,
    props.country || "India",
  ].filter(Boolean);

  const cleanLabel = Array.from(new Set(parts)).join(", ");

  return {
    label: cleanLabel,
    lat: geom[1],
    lng: geom[0],
  };
}

export async function searchPlace(query: string): Promise<GeocodeResult[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const lowerQ = cleanQ.toLowerCase();

  // 1. Instant local matching from popular Indian roadtrip destinations
  const localMatches = POPULAR_INDIAN_DESTINATIONS.filter((item) => {
    const l = item.label.toLowerCase();
    // Matches "chandig" -> "Chandigarh, India"
    return l.includes(lowerQ) || lowerQ.split(" ").every((word) => l.includes(word));
  }).slice(0, 4);

  // 2. Query Photon Autocomplete API (OSM elasticsearch index, handles partial prefixes seamlessly)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQ)}&limit=6&lang=en&lat=30.7333&lon=76.7794`;
    const res = await fetch(photonUrl, {
      headers: { "User-Agent": "convoy-app (India roadtrip sharing)" },
    });

    if (res.ok) {
      const data = await res.json();
      const photonResults: GeocodeResult[] = (data.features || [])
        .map(formatPhotonFeature)
        .filter((x: GeocodeResult | null): x is GeocodeResult => x !== null);

      // Merge results avoiding duplicate locations
      const combined = [...localMatches];
      for (const pr of photonResults) {
        const isDuplicate = combined.some(
          (c) =>
            c.label.toLowerCase() === pr.label.toLowerCase() ||
            (Math.abs(c.lat - pr.lat) < 0.01 && Math.abs(c.lng - pr.lng) < 0.01),
        );
        if (!isDuplicate) {
          combined.push(pr);
        }
      }

      if (combined.length > 0) {
        return combined.slice(0, 6);
      }
    }
  } catch (err) {
    console.warn("Photon search error, falling back to Nominatim / local index:", err);
  }

  // 3. Fallback: Nominatim OpenStreetMap
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      cleanQ,
    )}&format=json&limit=5&countrycodes=in`;
    const res = await fetch(nomUrl, {
      headers: { "User-Agent": "convoy-app (India roadtrip sharing)" },
    });
    if (res.ok) {
      const data: { display_name: string; lat: string; lon: string }[] = await res.json();
      const nomResults = data.map((item) => ({
        label: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

      const combined = [...localMatches];
      for (const nr of nomResults) {
        if (!combined.some((c) => c.label.toLowerCase() === nr.label.toLowerCase())) {
          combined.push(nr);
        }
      }
      return combined.slice(0, 6);
    }
  } catch (err) {
    console.warn("Nominatim fallback failed:", err);
  }

  return localMatches;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // Try Photon Reverse first
  try {
    const photonUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`;
    const res = await fetch(photonUrl, {
      headers: { "User-Agent": "convoy-app (India roadtrip sharing)" },
    });
    if (res.ok) {
      const data = await res.json();
      const feat = data?.features?.[0];
      if (feat) {
        const formatted = formatPhotonFeature(feat);
        if (formatted?.label) return formatted.label;
      }
    }
  } catch {
    // Fall back to Nominatim
  }

  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lng), format: "json" });
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: { "User-Agent": "convoy-app (India roadtrip sharing)" },
    });
    if (res.ok) {
      const data: { display_name?: string } = await res.json();
      if (data.display_name) return data.display_name;
    }
  } catch {
    // Return coordinate fallback
  }

  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
