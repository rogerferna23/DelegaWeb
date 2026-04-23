import DOMPurify from 'dompurify';

/**
 * Sanitiza una cadena eliminando etiquetas HTML para prevenir XSS.
 * Úsalo en cualquier input que se vaya a mostrar en el DOM.
 */
export function sanitize(str: unknown): string {
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
 * Sanitiza solo texto plano — elimina todo HTML/atributos incluyendo
 * caracteres Unicode que emulan < > (p.ej. ＜ U+FF1C).
 */
export function sanitizeText(str: unknown): string {
  if (!str) return '';
  // DOMPurify con ALLOWED_TAGS vacío extrae solo el texto, bloqueando
  // cualquier variante Unicode de etiquetas HTML.
  return DOMPurify.sanitize(String(str), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}
