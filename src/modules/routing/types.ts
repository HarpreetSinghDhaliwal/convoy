export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeocodeResult extends GeoPoint {
  label: string;
}

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  // GeoJSON LineString geometry — fed straight into save_trip_route's RPC
  // and MapLibre's GeoJSONSource, never hand-parsed elsewhere.
  geometry: { type: "LineString"; coordinates: [number, number][] };
}
