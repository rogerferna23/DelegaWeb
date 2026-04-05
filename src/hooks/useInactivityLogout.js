import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 min

export function useInactivityLogout() {
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      await supabase.auth.signOut();
      window.location.href = "/login?reason=inactivity";
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
