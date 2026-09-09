import { supabase } from "@/lib/supabase/client";
import type { KycStatus } from "../types";

// DigiLocker's real Requester API needs this app registered as a Partner
// Organization via API Setu first — an identity/purpose-check approval
// process, not an instant key (blueprint §08). Until that's done,
// verification runs through this manual-review stub instead of a fake
// button pretending to do government verification it can't actually do yet.
//
// Every screen/hook in this module calls getKycStatus()/startVerification()
// — never talks to Supabase or DigiLocker directly — so swapping the stub
// body for a real DigiLocker OAuth 2.0 flow later touches this file only.

export async function getKycStatus(userId: string): Promise<KycStatus> {
  const { data, error } = await supabase
    .from("users")
    .select("kyc_status")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return (data?.kyc_status as KycStatus) ?? "unverified";
}

export async function startVerification(userId: string): Promise<void> {
  // STUB — marks pending for manual admin review. Replace with: redirect
  // into DigiLocker's OAuth 2.0 authorization-code flow, exchange the code,
  // pull the requested document, verify it, then set 'verified'/'rejected'
  // — once the Partner Organization registration is actually approved.
  const { error } = await supabase
    .from("users")
    .update({ kyc_status: "pending" satisfies KycStatus })
    .eq("id", userId);
  if (error) throw error;
}
