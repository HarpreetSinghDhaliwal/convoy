import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import {
  addFavoriteLocation,
  listFavoriteLocations,
  removeFavoriteLocation,
} from "../services/favoriteLocationService";
import type { FavoriteLocation } from "../types";

export function useFavoriteLocations() {
  const { session } = useAuthSession();
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    async function load() {
      const userId = session?.user.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        setFavorites(await listFavoriteLocations(userId));
      } finally {
        setLoading(false);
      }
    }
    return load();
  }, [session?.user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function add(label: string, lat: number, lng: number, radiusKm?: number) {
    if (!session?.user.id) return;
    await addFavoriteLocation(session.user.id, label, lat, lng, radiusKm);
    refresh();
  }

  async function remove(id: string) {
    await removeFavoriteLocation(id);
    refresh();
  }

  return {
    favorites,
    loading,
    isFavorited: (label: string) => favorites.some((f) => f.label === label),
    add,
    remove,
  };
}
