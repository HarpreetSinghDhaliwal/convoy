// Typed, single source of truth for runtime config. Every module reads
// config through here — never `process.env` directly — so there's one place
// to see what the app depends on, and one place to update when a new env
// var is needed as modules grow.
//
// Env vars must be referenced statically (process.env.EXACT_NAME) — Expo's
// Metro plugin inlines EXPO_PUBLIC_-prefixed vars at build time by matching
// that exact literal pattern; a dynamic process.env[key] lookup can't be
// statically inlined and silently resolves to undefined at runtime instead
// of failing at build time. eslint's expo/no-dynamic-env-var rule catches
// exactly this.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required env var ${name} — copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  ),

  // Compliance contact (IT Rules 2021, blueprint §05) — genuinely optional
  // at the type level, unlike the Supabase vars above: the app runs fine
  // without it set, just shows a "not yet assigned" placeholder instead of
  // throwing. Current values are a stated temporary placeholder, swappable
  // here without touching GrievanceOfficerScreen's code.
  grievanceOfficerName: process.env.EXPO_PUBLIC_GRIEVANCE_OFFICER_NAME || null,
  grievanceOfficerPhone: process.env.EXPO_PUBLIC_GRIEVANCE_OFFICER_PHONE || null,
};
