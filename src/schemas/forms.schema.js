import { z } from 'zod';

// ── Reutilizables ───────────────────────────────────────────────────────────
const nonEmptyString = (label, min = 1, max = 200) =>
  z.string({ required_error: `${label} es obligatorio` })
    .trim()
    .min(min, `${label} debe tener al menos ${min} caracteres`)
    .max(max, `${label} es demasiado largo`);

const emailField = z.string({ required_error: 'El email es obligatorio' })
  .trim()
  .email('Formato de email no válido')
  .max(254, 'Email demasiado largo');

// Tel\u00E9fono internacional flexible: d\u00EDgitos, espacios, guiones, par\u00E9ntesis y +.
// Exige 7-15 d\u00EDgitos en total (rango ITU-T E.164).
const phoneField = z.string({ required_error: 'El tel\u00E9fono es obligatorio' })
  .trim()
  .regex(/^[+()\-\s\d]{7,20}$/, 'Formato de tel\u00E9fono no v\u00E1lido')
  .refine(v => v.replace(/\D/g, '').length >= 7 && v.replace(/\D/g, '').length <= 15,
    'El tel\u00E9fono debe tener entre 7 y 15 d\u00EDgitos');

const optionalUrl = z.string().trim().url('URL no v\u00E1lida').max(500).optional().or(z.literal(''));

const positiveAmount = z.coerce.number({
  required_error: 'El importe es obligatorio',
  invalid_type_error: 'El importe debe ser num\u00E9rico',
})
  .positive('El importe debe ser mayor que 0')
  .max(1_000_000, 'El importe parece demasiado alto');

const isoDate = z.string({ required_error: 'La fecha es obligatoria' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inv\u00E1lido (YYYY-MM-DD)')
  .refine(v => !Number.isNaN(Date.parse(v)), 'Fecha inv\u00E1lida');

// ── Ventas ──────────────────────────────────────────────────────────────────
export const ventaSchema = z.object({
  clienteNombre: nonEmptyString('El nombre del cliente', 2, 100),
  clienteEmail: emailField,
  clienteTelefono: phoneField.optional().or(z.literal('')),
  servicio: nonEmptyString('El servicio', 1, 150),
  importe: positiveAmount,
  fecha: isoDate.optional(),
  campana: z.string().max(150).optional().or(z.literal('')),
  estado: z.enum(['pendiente_pago', 'pagado', 'cancelado']).optional(),
});

// ── Gastos ──────────────────────────────────────────────────────────────────
export const gastoSchema = z.object({
  description: nonEmptyString('La descripci\u00F3n', 2, 200),
  amount: positiveAmount,
  date: isoDate,
});

// ── Postulantes (trabaja-con-nosotros / CloserProgram) ─────────────────────
export const postulanteSchema = z.object({
  nombre: nonEmptyString('El nombre', 2, 100),
  email: emailField,
  telefono: phoneField,
  website: optionalUrl,
  mensaje: z.string().max(1000).optional().or(z.literal('')),
});

// ── Checkout p\u00FAblico (PayPal) ──────────────────────────────────────────────
export const checkoutSchema = z.object({
  nombre: nonEmptyString('El nombre', 2, 100),
  email: emailField,
  telefono: phoneField,
  campana: z.string().max(150).optional().or(z.literal('')),
});

// ── Perfil de negocio (wizard NuevaCampana \u2014 paso 1) ──────────────────────
export const businessProfileSchema = z.object({
  company_name: nonEmptyString('El nombre de la empresa', 2, 150),
  industry: z.string().max(120).optional().or(z.literal('')),
  website: optionalUrl,
  description: z.string().max(2000).optional().or(z.literal('')),
});

// ── Vendedor ────────────────────────────────────────────────────────────────
export const vendorSchema = z.object({
  name: nonEmptyString('El nombre', 2, 100),
  email: emailField.optional().or(z.literal('')),
  phone: phoneField.optional().or(z.literal('')),
  specialty: z.string().max(120).optional().or(z.literal('')),
});

// ── Helper com\u00FAn para resolver errores de Zod a { campo: mensaje } ──────
/**
 * Convierte el ZodError en un objeto plano { campo: "mensaje" } para mostrar
 * junto a cada input. Si hay varios errores en un mismo campo, devuelve el primero.
 */
export function zodErrorsToObject(err) {
  if (!err || !err.issues) return {};
  const out = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Valida contra un schema y devuelve { ok, data, errors }.
 * - ok=true  \u2192 data contiene los valores limpios (parseados/coercionados por Zod)
 * - ok=false \u2192 errors es un objeto { campo: mensaje }
 */
export function validate(schema, input) {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data, errors: null };
  return { ok: false, data: null, errors: zodErrorsToObject(result.error) };
}
