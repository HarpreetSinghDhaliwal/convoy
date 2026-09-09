import { supabase } from "@/lib/supabase/client";
import type { ConsentStatus, ConsentType } from "../types";

const COLUMN_BY_TYPE: Record<ConsentType, string> = {
  kyc: "consent_kyc_at",
  location: "consent_location_at",
  chat: "consent_chat_at",
};

const consentListeners = new Set<() => void>();

export function subscribeConsentStatus(listener: () => void) {
  consentListeners.add(listener);
  return () => {
    consentListeners.delete(listener);
  };
}

export function notifyConsentChanged() {
  consentListeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error("Error in consent listener:", e);
    }
  });
}

export async function getConsentStatus(userId: string): Promise<ConsentStatus> {
  const { data, error } = await supabase
    .from("users")
    .select("consent_kyc_at, consent_location_at, consent_chat_at, consent_complete")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("getConsentStatus query error:", error);
    return { kyc: false, location: false, chat: false, complete: false };
  }

  if (!data) {
    return { kyc: false, location: false, chat: false, complete: false };
  }

  const kyc = Boolean(data.consent_kyc_at);
  const location = Boolean(data.consent_location_at);
  const chat = Boolean(data.consent_chat_at);
  const complete = Boolean(data.consent_complete || (kyc && location && chat));

  return { kyc, location, chat, complete };
}

// Atomic multi-consent recording with individual timestamps & insert fallback
export async function recordConsents(userId: string, types: ConsentType[]): Promise<void> {
  const now = new Date().toISOString();
  const updates: Record<string, string> = {};
  for (const type of types) {
    updates[COLUMN_BY_TYPE[type]] = now;
  }

  // 1. Try update first
  const { error: updateErr } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId);

  if (updateErr) {
    console.warn("recordConsents update failed, attempting upsert:", updateErr);
    // If update failed (e.g. row doesn't exist yet), upsert
    const { error: upsertErr } = await supabase
      .from("users")
      .upsert({ id: userId, phone: "", ...updates }, { onConflict: "id" });

    if (upsertErr) {
      console.error("recordConsents upsert failed:", upsertErr);
      throw upsertErr;
    }
  }

  // Notify all active hooks & screens immediately
  notifyConsentChanged();
}

export async function recordConsent(userId: string, type: ConsentType): Promise<void> {
  return recordConsents(userId, [type]);
}
