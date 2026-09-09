import { supabase } from "@/lib/supabase/client";
import type { ConsentStatus, ConsentType } from "../types";

const COLUMN_BY_TYPE: Record<ConsentType, string> = {
  kyc: "consent_kyc_at",
  location: "consent_location_at",
  chat: "consent_chat_at",
};

export async function getConsentStatus(userId: string): Promise<ConsentStatus> {
  const { data, error } = await supabase
    .from("users")
    .select("consent_kyc_at, consent_location_at, consent_chat_at, consent_complete")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return {
    kyc: Boolean(data?.consent_kyc_at),
    location: Boolean(data?.consent_location_at),
    chat: Boolean(data?.consent_chat_at),
    complete: Boolean(data?.consent_complete),
  };
}

// Each consent recorded separately, with its own timestamp — never one
// bundled "I agree to everything" write. Callers grant one type at a time.
export async function recordConsent(userId: string, type: ConsentType): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ [COLUMN_BY_TYPE[type]]: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}
