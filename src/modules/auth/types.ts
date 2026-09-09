import type { Session } from "@supabase/supabase-js";

export interface AuthSessionState {
  session: Session | null;
  loading: boolean;
}
