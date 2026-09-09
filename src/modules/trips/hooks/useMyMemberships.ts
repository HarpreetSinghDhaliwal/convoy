import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import { getMyMemberships, subscribeToMyMemberships } from "../services/tripService";
import type { TripMember } from "../types";

export function useMyMemberships() {
  const { session } = useAuthSession();
  const [memberships, setMemberships] = useState<TripMember[]>([]);
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
        setMemberships(await getMyMemberships(userId));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session?.user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;
    const unsubscribe = subscribeToMyMemberships(userId, () => {
      refresh();
    });
    return unsubscribe;
  }, [session?.user.id, refresh]);

  return { memberships, loading, refresh };
}
