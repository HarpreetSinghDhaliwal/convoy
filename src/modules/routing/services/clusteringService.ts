import type { GeoPoint } from "../types";

// Phase 05, deliberately scoped honestly: a geometric centroid, not a
// detour-minimizing optimizer. Suggesting the pickup point that actually
// minimizes total travel time for every joiner is a facility-location
// problem — real optimization, a genuinely bigger lift than this. A
// centroid is still a legitimate, standard starting point (plenty of real
// carpool products ship exactly this as v1), just not oversold as more.
export function suggestMeetingPoint(points: GeoPoint[]): GeoPoint | null {
  if (points.length === 0) return null;
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}
