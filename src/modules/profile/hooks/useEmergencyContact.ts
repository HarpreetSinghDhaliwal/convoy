import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import { getEmergencyContact, setEmergencyContact } from "../services/profileService";
import type { EmergencyContact } from "../types";

// The one place that answers "does this user have an emergency contact set"
// — kyc gates on it (blueprint's verification flow requires it before
// verification starts), safety's SosButton depends on it existing to have
// anyone to share location with.
export function useEmergencyContact() {
  const { session } = useAuthSession();
  const [contact, setContact] = useState<EmergencyContact | null>(null);
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
        setContact(await getEmergencyContact(userId));
      } finally {
        setLoading(false);
      }
    }
    return load();
  }, [session?.user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function save(next: EmergencyContact) {
    if (!session?.user.id) return;
    await setEmergencyContact(session.user.id, next);
    refresh();
  }

  return { contact, loading, isSet: !!contact, save };
}
