import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/** Chế độ session (không Supabase): loading=false, session=null và app không cần đăng nhập */
export function useAuth() {
  const [state, setState] = useState<{ loading: boolean; session: Session | null }>({ loading: supabase !== null, session: null });

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setState({ loading: false, session: data.session }));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setState({ loading: false, session }));
    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}

export const signOut = () => supabase?.auth.signOut();
