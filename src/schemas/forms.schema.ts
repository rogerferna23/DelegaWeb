import { z } from 'zod';

// ── Reutilizables ───────────────────────────────────────────────────────────
// Zod v4: usa `error` en lugar de `required_error`
const nonEmptyString = (label: string, min = 1, max = 200) =>
  z.string({ error: `${label} es obligatorio` })
    .trim()
    .min(min, `${label} debe tener al menos ${min} caracteres`)
    .max(max, `${label} es demasiado largo`);

const emailField = z
  .string({ error: 'El email es obligatorio' })
  .trim()
  .email('Formato de email no válido')
  .max(254, 'Email demasiado largo');

// Teléfono internacional flexible: dígitos, espacios, guiones, paréntesis y +.
// Exige 7-15 dígitos en total (rango ITU-T E.164).
const phoneField = z
  .string({ error: 'El teléfono es obligatorio' })
  .trim()
  .regex(/^[+()\-\s\d]{7,20}$/, 'Formato de teléfono no válido')
  .refine(
    v => v.replace(/\D/g, '').length >= 7 && v.replace(/\D/g, '').length <= 15,
    'El teléfono debe tener entre 7 y 15 dígitos',
  );

const optionalUrl = z.string().trim().url('URL no válida').max(500).optional().or(z.literal(''));

const positiveAmount = z
  .coerce.number({
    error: 'El importe es obligatorio o debe ser numérico',
  })
  .positive('El importe debe ser mayor que 0')
  .max(1_000_000, 'El importe parece demasiado alto');

const isoDate = z
  .string({ error: 'La fecha es obligatoria' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
  .refine(v => !Number.isNaN(Date.parse(v)), 'Fecha inválida');

// ── Ventas ──────────────────────────────────────────────────────────────────
export const ventaSchema = z.object({
  clienteNombre:    nonEmptyString('El nombre del cliente', 2, 100),
  clienteEmail:     emailField,
  clienteTelefono:  phoneField.optional().or(z.literal('')),
  servicio:         nonEmptyString('El servicio', 1, 150),
  importe:          positiveAmount,
  fecha:            isoDate.optional(),
  campana:          z.string().max(150).optional().or(z.literal('')),
  estado:           z.enum(['pendiente_pago', 'pagado', 'cancelado']).optional(),
});

export type VentaInput = z.infer<typeof ventaSchema>;

// ── Gastos ──────────────────────────────────────────────────────────────────
export const gastoSchema = z.object({
  description: nonEmptyString('La descripción', 2, 200),
  amount:      positiveAmount,
  date:        isoDate,
});

export type GastoInput = z.infer<typeof gastoSchema>;

// ── Postulantes (trabaja-con-nosotros / CloserProgram) ─────────────────────
export const postulanteSchema = z.object({
  nombre:  nonEmptyString('El nombre', 2, 100),
  email:   emailField,
  telefono: phoneField,
  website: optionalUrl,
  mensaje: z.string().max(1000).optional().or(z.literal('')),
});

export type PostulanteInput = z.infer<typeof postulanteSchema>;

// ── Checkout público (PayPal) ───────────────────────────────────────────────
export const checkoutSchema = z.object({
  nombre:   nonEmptyString('El nombre', 2, 100),
  email:    emailField,
  telefono: phoneField,
  campana:  z.string().max(150).optional().or(z.literal('')),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ── Perfil de negocio (wizard NuevaCampana — paso 1) ──────────────────────
export const businessProfileSchema = z.object({
  company_name: nonEmptyString('El nombre de la empresa', 2, 150),
  industry:     z.string().max(120).optional().or(z.literal('')),
  website:      optionalUrl,
  description:  z.string().max(2000).optional().or(z.literal('')),
});

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;

// ── Vendedor ────────────────────────────────────────────────────────────────
export const vendorSchema = z.object({
  name:      nonEmptyString('El nombre', 2, 100),
  email:     emailField.optional().or(z.literal('')),
  phone:     phoneField.optional().or(z.literal('')),
  specialty: z.string().max(120).optional().or(z.literal('')),
});

export type VendorInput = z.infer<typeof vendorSchema>;

// ── Helper común para resolver errores de Zod a { campo: mensaje } ──────
/**
 * Convierte el ZodError en un objeto plano { campo: "mensaje" } para mostrar
 * junto a cada input. Si hay varios errores en un mismo campo, devuelve el primero.
 */
export function zodErrorsToObject(err: z.ZodError): Record<string, string> {
  if (!err?.issues) return {};
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

interface ValidationSuccess<T> {
  ok: true;
  data: T;
  errors: null;
}

interface ValidationFailure {
  ok: false;
  data: null;
  errors: Record<string, string>;
}

/**
 * Valida contra un schema y devuelve { ok, data, errors }.
 * - ok=true  → data contiene los valores limpios (parseados/coercionados por Zod)
 * - ok=false → errors es un objeto { campo: mensaje }
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
): ValidationSuccess<T> | ValidationFailure {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data, errors: null };
  return { ok: false, data: null, errors: zodErrorsToObject(result.error) };
}
