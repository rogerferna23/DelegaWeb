// Detección y recuperación automática de errores de chunk.
//
// Problema: cuando desplegamos una nueva versión a producción, los usuarios
// que ya tenían la web abierta siguen con el HTML viejo cacheado. Al navegar
// a una ruta perezosa (lazy route), el navegador intenta cargar un JS cuyo
// hash ya no existe en el CDN, y Vite lanza ChunkLoadError / "Failed to
// fetch dynamically imported module". Si no lo manejamos, el usuario ve una
// pantalla en blanco o "Algo salió mal" hasta que refresca manualmente.
//
// Solución: detectamos esos errores concretos y forzamos un reload (una vez)
// para que el navegador baje el index.html nuevo, con las referencias a los
// chunks actualizados. Un flag en sessionStorage evita loops infinitos si el
// problema no es un chunk (para no recargar eternamente).

const RELOAD_GUARD_KEY = 'delegaweb:chunk-reload:attempted';

/**
 * Devuelve true si el error parece ser un fallo de carga de chunk/módulo
 * dinámico (deploy nuevo, CDN intermedia, red caída al traer chunk, etc).
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const name = typeof error.name === 'string' ? error.name : '';
  const message = typeof error.message === 'string'
    ? error.message
    : String(error || '');

  if (name === 'ChunkLoadError') return true;

  return (
    /Loading chunk [\d\w]+ failed/i.test(message) ||
    /Loading CSS chunk [\d\w]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Unable to preload CSS/i.test(message)
  );
}

/**
 * Si el error es de chunk, recarga la página (una sola vez por sesión).
 * Devuelve true si disparó el reload — el caller debería detener su flujo
 * de renderizado de error en ese caso.
 */
export function reloadIfChunkError(error) {
  if (!isChunkLoadError(error)) return false;

  try {
    const alreadyTried = sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (alreadyTried) {
      // Ya intentamos recargar y volvió a fallar. No insistir — dejamos que
      // el ErrorBoundary muestre mensaje normal y el usuario decida.
      return false;
    }
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // sessionStorage bloqueado (modo privado estricto) — igual recargamos.
  }

  // Reload sin cache para bajar el index.html nuevo.
  window.location.reload();
  return true;
}

/**
 * Llama esto al inicio de la app para limpiar el guard cuando la nueva
 * versión cargó correctamente. Si el código llegó a ejecutarse es que el
 * chunk de entrada se bajó bien, entonces ya no estamos en el loop malo.
 */
export function clearChunkReloadGuard() {
  try {
    sessionStorage.removeItem(RELOAD_GUARD_KEY);
  } catch { /* noop */ }
}
