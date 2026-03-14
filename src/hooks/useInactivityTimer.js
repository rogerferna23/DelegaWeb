import { useEffect, useRef, useState, useCallback } from 'react';

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutos
const WARNING_MS = 60 * 1000;          // advertencia 60 seg antes

/**
 * Hook que cierra sesión automáticamente tras inactividad.
 * @param {Function} onLogout - Función a llamar al expirar la sesión
 * @returns {{ showWarning, countdown, stayActive }}
 */
export function useInactivityTimer(onLogout) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const logoutTimer = useRef(null);
  const warningTimer = useRef(null);
  const countdownInterval = useRef(null);

  const clearAll = useCallback(() => {
    clearTimeout(logoutTimer.current);
    clearTimeout(warningTimer.current);
    clearInterval(countdownInterval.current);
  }, []);

  const resetTimer = useCallback(() => {
    clearAll();
    setShowWarning(false);
    setCountdown(60);

    // Advertencia antes del logout
    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(60);
      countdownInterval.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(countdownInterval.current); return 0; }
          return c - 1;
        });
      }, 1000);
    }, INACTIVITY_MS - WARNING_MS);

    // Logout automático
    logoutTimer.current = setTimeout(() => {
      clearAll();
      onLogout();
    }, INACTIVITY_MS);
  }, [onLogout, clearAll]);

  // Reinicia el timer en cualquier actividad del usuario
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
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
