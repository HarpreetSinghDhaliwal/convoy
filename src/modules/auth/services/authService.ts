import { supabase } from "@/lib/supabase/client";

// Email is the required login identity (not phone) — SMS costs money with
// every provider, email OTP through a custom SMTP sender (Brevo, free
// tier) doesn't. See migration 0012 for the schema side of this.

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function requestOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
  if (error) throw error;
}

export async function verifyOtp(email: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: code,
    type: "email",
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
