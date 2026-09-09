import { useEffect, useState } from "react";
import { getRoute } from "../services/osrmService";
import type { GeoPoint, RouteResult } from "../types";

export function useRoute(origin: GeoPoint | null, destination: GeoPoint | null) {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Destructured to primitives so the effect's dependency array doesn't
  // need the full objects (a fresh object reference each render would
  // otherwise re-trigger this on every parent re-render, not just when the
  // actual coordinates change).
  const originLat = origin?.lat;
  const originLng = origin?.lng;
  const destLat = destination?.lat;
  const destLng = destination?.lng;

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
          await getRoute({ lat: originLat, lng: originLng }, { lat: destLat, lng: destLng }),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't calculate the route");
        setRoute(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [originLat, originLng, destLat, destLng]);

  return { route, loading, error };
}
