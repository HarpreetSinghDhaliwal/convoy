import { useUserProfile } from "./useUserProfile";
import type { EmergencyContact } from "../types";

// Gates the (app) group in root layout — required before entering app.
// Checks if traveler profile has both name & phone registered.
export function usePhone() {
  const { profile, loading, refresh, updateProfile } = useUserProfile();

  async function save(payload: string | {
    phone: string;
    name?: string;
    photoUrl?: string;
    emergencyContact?: EmergencyContact;
  }) {
    if (typeof payload === "string") {
      await updateProfile({ phone: payload });
    } else {
      await updateProfile(payload);
    }
  }

  const hasPhone = !!(profile?.phone && profile?.name);

  return {
    phone: profile?.phone ?? null,
    name: profile?.name ?? null,
    profile,
    loading,
    hasPhone,
    save,
    refresh,
  };
}
