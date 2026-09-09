import type { GeoPoint, RouteResult } from "../types";

// Primary and fallback OSRM driving servers (OpenStreetMap road network)
const OSRM_SERVERS = [
  "https://router.project-osrm.org",
  "https://routing.openstreetmap.de/routed-car",
];

export async function getRoute(
  origin: GeoPoint,
  destination: GeoPoint,
  checkpoints: GeoPoint[] = [],
): Promise<RouteResult> {
  const points: GeoPoint[] = [
    origin,
    ...checkpoints.filter((c) => c && c.lat != null && c.lng != null),
    destination,
  ];

  const coordsString = points.map((p) => `${p.lng},${p.lat}`).join(";");

  let lastError: Error | null = null;

  for (const server of OSRM_SERVERS) {
    try {
      const url = `${server}/route/v1/driving/${coordsString}?overview=full&geometries=geojson&steps=false`;
      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();
      if (data.code === "Ok" && data.routes?.length > 0) {
        const route = data.routes[0];
        return {
          distanceKm: route.distance / 1000,
          durationMin: route.duration / 60,
          geometry: route.geometry,
        };
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("Could not calculate driving route across roads");
}
