import DOMPurify from 'dompurify';

// Para texto plano (la mayoría de campos)
export function sanitize(dirty: string): string;
export function sanitize(dirty: unknown): unknown;
export function sanitize(dirty: unknown): unknown {
  if (typeof dirty !== 'string') return dirty;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

// Para campos que necesitan HTML limitado
export function sanitizeRich(dirty: string): string;
export function sanitizeRich(dirty: unknown): unknown;
export function sanitizeRich(dirty: unknown): unknown {
  if (typeof dirty !== 'string') return dirty;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
  });
}
