import { useCallback, useEffect, useState } from "react";
import { addPickupPoint, listPickupPoints, removePickupPoint } from "../services/pickupPointService";
import type { PickupPoint } from "../types";

export function usePickupPoints(tripId: string | undefined) {
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    async function load() {
      if (!tripId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        setPoints(await listPickupPoints(tripId));
      } finally {
        setLoading(false);
      }
    }
    return load();
  }, [tripId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function add(label: string, lat: number, lng: number) {
    if (!tripId) return;
    await addPickupPoint(tripId, label, lat, lng);
    refresh();
  }

  async function remove(id: string) {
    await removePickupPoint(id);
    refresh();
  }

  return { points, loading, add, remove, refresh };
}
