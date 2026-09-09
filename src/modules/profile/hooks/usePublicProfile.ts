import { useEffect, useState } from "react";
import { getPublicProfile } from "../services/profileService";
import type { PublicProfile } from "../types";

export function usePublicProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        setProfile(await getPublicProfile(userId));
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  return { profile, loading };
}
