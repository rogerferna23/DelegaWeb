import DOMPurify from 'dompurify';

// Para texto plano (la mayoría de campos)
export function sanitize(dirty) {
  if (typeof dirty !== 'string') return dirty;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

// Para campos que necesitan HTML limitado
export function sanitizeRich(dirty) {
  if (typeof dirty !== 'string') return dirty;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: []
  });
}
