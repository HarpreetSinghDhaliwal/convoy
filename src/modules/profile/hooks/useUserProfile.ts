import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import { getUserProfile, updateUserProfile } from "../services/profileService";
import type { EmergencyContact, UserProfile } from "../types";

export function useUserProfile() {
  const { session } = useAuthSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
        setProfile(await getUserProfile(userId));
      } catch (err) {
        console.error("useUserProfile: failed to load", err);
      } finally {
        setLoading(false);
      }
    }
    return load();
  }, [session?.user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function updateProfile(updates: {
    name?: string;
    phone?: string;
    photoUrl?: string;
    emergencyContact?: EmergencyContact;
  }) {
    if (!session?.user.id) return;
    await updateUserProfile(session.user.id, updates);
    await refresh();
  }

  const isProfileComplete = !!(profile?.name && profile?.phone);

  return {
    profile,
    loading,
    isProfileComplete,
    updateProfile,
    refresh,
  };
}
