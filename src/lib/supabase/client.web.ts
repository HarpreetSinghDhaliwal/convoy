import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/config/env";

// Web variant — Metro picks this over client.ts automatically when
// bundling for web. expo-secure-store's web implementation is a genuine
// empty stub in this SDK version (`export default {}` — not a localStorage
// fallback), so every getItemAsync/setItemAsync call throws
// "is not a function" at runtime. There's no secure-enclave equivalent in
// a browser anyway, so this uses localStorage directly — the same default
// Supabase's own browser/SPA client uses for session persistence.
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
