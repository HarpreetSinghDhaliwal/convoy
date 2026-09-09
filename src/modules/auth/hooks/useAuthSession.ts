import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { AuthSessionState } from "../types";

// The one place that knows how to read "is anyone logged in" — every module
// that needs to gate on auth state imports this hook rather than touching
// supabase.auth directly.
export function useAuthSession(): AuthSessionState {
  const [state, setState] = useState<AuthSessionState>({ session: null, loading: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState({ session: data.session, loading: false });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, loading: false });
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return state;
}
