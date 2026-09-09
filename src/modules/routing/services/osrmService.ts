import type { GeoPoint, RouteResult } from "../types";

// OSRM's public demo server — free, no key, same "prototyping/light use,
// not scaled production" caveat as Nominatim above. Unlike Overpass, there
// isn't a well-known set of public mirrors to fall back across, so this is
// a single attempt with a clear error rather than a mirror list — self-
// hosting is the honest answer once this needs to be reliable at scale.
const OSRM_BASE = "https://router.project-osrm.org";

export async function getRoute(origin: GeoPoint, destination: GeoPoint): Promise<RouteResult> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM routing failed: ${res.status}`);

  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error(`OSRM couldn't find a route: ${data.code ?? "unknown error"}`);
  }

  const route = data.routes[0];
  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    geometry: route.geometry,
  };
}
