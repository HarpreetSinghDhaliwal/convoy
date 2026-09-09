import { useEffect, useState } from "react";
import { getRoute } from "../services/osrmService";
import type { GeoPoint, RouteResult } from "../types";

export function useRoute(
  origin: GeoPoint | null,
  destination: GeoPoint | null,
  checkpoints: GeoPoint[] = [],
) {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const originLat = origin?.lat;
  const originLng = origin?.lng;
  const destLat = destination?.lat;
  const destLng = destination?.lng;
  const checkpointsKey = JSON.stringify(checkpoints.map((c) => [c.lat, c.lng]));

  useEffect(() => {
    async function load() {
      if (originLat == null || originLng == null || destLat == null || destLng == null) {
        setRoute(null);
        return;
      }
      setLoading(true);
      setError(undefined);
      try {
        setRoute(
          await getRoute(
            { lat: originLat, lng: originLng },
            { lat: destLat, lng: destLng },
            JSON.parse(checkpointsKey).map(([lat, lng]: [number, number]) => ({ lat, lng })),
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't calculate the route");
        setRoute(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [originLat, originLng, destLat, destLng, checkpointsKey]);

  return { route, loading, error };
}
