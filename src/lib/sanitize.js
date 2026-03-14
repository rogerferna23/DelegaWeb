/**
 * Sanitiza una cadena eliminando etiquetas HTML para prevenir XSS.
 * Úsalo en cualquier input que se vaya a mostrar en el DOM.
 */
export function sanitize(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

/**
 * Sanitiza solo texto (no HTML) — mantiene el valor pero elimina caracteres peligrosos.
 */
export function sanitizeText(str) {
  if (!str) return '';
  return String(str).replace(/[<>'"]/g, '').trim();
}
