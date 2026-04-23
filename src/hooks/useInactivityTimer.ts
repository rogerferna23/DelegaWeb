import { useEffect, useRef, useState, useCallback } from 'react';

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutos
const WARNING_MS    =  1 * 60 * 1000; // advertencia 60 seg antes

/**
 * Hook que cierra sesión automáticamente tras inactividad.
 * @param onLogout - Función a llamar al expirar la sesión
 */
export function useInactivityTimer(onLogout: () => void) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const logoutTimer        = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const warningTimer       = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const countdownInterval  = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = useCallback(() => {
    if (logoutTimer.current)       clearTimeout(logoutTimer.current);
    if (warningTimer.current)      clearTimeout(warningTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  }, []);

  const resetTimer = useCallback(() => {
    clearAll();
    setShowWarning(false);
    setCountdown(60);

    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(60);
      countdownInterval.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            if (countdownInterval.current) clearInterval(countdownInterval.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }, INACTIVITY_MS - WARNING_MS);

    logoutTimer.current = setTimeout(() => {
      clearAll();
      onLogout();
    }, INACTIVITY_MS);
  }, [onLogout, clearAll]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'] as const;
    const handler = () => resetTimer();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearAll();
    };
  }, [resetTimer, clearAll]);

  const stayActive = useCallback(() => resetTimer(), [resetTimer]);

  return { showWarning, countdown, stayActive };
}
