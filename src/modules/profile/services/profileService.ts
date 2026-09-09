import { supabase } from "@/lib/supabase/client";
import type { EmergencyContact, PublicProfile, UserProfile } from "../types";

const profileListeners = new Set<() => void>();

export function subscribeProfile(listener: () => void) {
  profileListeners.add(listener);
  return () => {
    profileListeners.delete(listener);
  };
}

export function notifyProfileChanged() {
  profileListeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error("Error in profile listener:", e);
    }
  });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, phone, photo_url, kyc_status, emergency_contact")
    .eq("id", userId)
    .single();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    name: data.name ?? null,
    phone: data.phone ?? null,
    photoUrl: data.photo_url ?? null,
    kycStatus: data.kyc_status,
    emergencyContact: (data.emergency_contact as EmergencyContact) ?? null,
  };
}

export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    phone?: string;
    photoUrl?: string;
    emergencyContact?: EmergencyContact;
  },
): Promise<void> {
  const payload: Record<string, any> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.phone !== undefined) payload.phone = updates.phone.trim();
  if (updates.photoUrl !== undefined) payload.photo_url = updates.photoUrl;
  if (updates.emergencyContact !== undefined) payload.emergency_contact = updates.emergencyContact;

  const { error: updateErr } = await supabase
    .from("users")
    .update(payload)
    .eq("id", userId);

  if (updateErr) {
    const { error: upsertErr } = await supabase
      .from("users")
      .upsert({ id: userId, phone: "", ...payload }, { onConflict: "id" });
    if (upsertErr) throw upsertErr;
  }

  notifyProfileChanged();
}

export async function getEmergencyContact(userId: string): Promise<EmergencyContact | null> {
  const { data, error } = await supabase
    .from("users")
    .select("emergency_contact")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return (data?.emergency_contact as EmergencyContact) ?? null;
}

export async function setEmergencyContact(
  userId: string,
  contact: EmergencyContact,
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ emergency_contact: contact })
    .eq("id", userId);
  if (error) throw error;
}

export async function getPublicProfile(userId: string): Promise<PublicProfile> {
  const { data, error } = await supabase
    .from("public_profiles")
    .select()
    .eq("id", userId)
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    photoUrl: data.photo_url,
    kycStatus: data.kyc_status,
  };
}

export async function getPhone(userId: string): Promise<string | null> {
  const { data, error } = await supabase.from("users").select("phone").eq("id", userId).single();
  if (error) throw error;
  return data?.phone ?? null;
}

export async function setPhone(userId: string, phone: string): Promise<void> {
  const { error } = await supabase.from("users").update({ phone }).eq("id", userId);
  if (error) throw error;
}

export async function getTripContactPhone(
  tripId: string,
  targetUserId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_trip_contact_phone", {
    p_trip_id: tripId,
    p_target_user_id: targetUserId,
  });
  if (error) throw error;
  return data;
}
