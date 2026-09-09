import type { GeocodeResult } from "../types";

// Nominatim's public instance — same lesson as the EV-charging sibling
// project's Overpass integration: a descriptive User-Agent is required, not
// optional (OSM's usage policy, and requests without one get a 406). Free
// public instance is for prototyping/light use, not scaled production —
// self-hosting is the real path once there's traffic (blueprint §07).
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const HEADERS = { "User-Agent": "convoy-app (India trip-sharing MVP)" };

export async function searchPlace(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "5",
    countrycodes: "in",
  });
  const res = await fetch(`${NOMINATIM_BASE}/search?${params.toString()}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Nominatim search failed: ${res.status}`);
  const data: { display_name: string; lat: string; lon: string }[] = await res.json();
  return data.map((item) => ({
    label: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lng), format: "json" });
  const res = await fetch(`${NOMINATIM_BASE}/reverse?${params.toString()}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Nominatim reverse geocode failed: ${res.status}`);
  const data: { display_name?: string } = await res.json();
  return data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
