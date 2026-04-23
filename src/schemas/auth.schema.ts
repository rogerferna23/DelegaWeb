import { z } from 'zod';

// ─── Login ───────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string({ error: 'El email es obligatorio' })
    .email('El formato del email no es válido'),
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Add Admin ───────────────────────────────────────────────────────────────

export const addAdminSchema = z.object({
  name: z
    .string({ error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre es demasiado largo'),
  email: z
    .string({ error: 'El email es obligatorio' })
    .email('El formato del email no es válido'),
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(12, 'La contraseña debe tener al menos 12 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[!@#$%^&*]/, 'Debe contener al menos un carácter especial (!@#$%^&*)'),
  role: z.enum(['admin', 'superadmin'], {
    error: 'El rol es obligatorio o no es válido',
  }),
});

export type AddAdminInput = z.infer<typeof addAdminSchema>;

// ─── MFA Verify ──────────────────────────────────────────────────────────────

export const mfaCodeSchema = z.object({
  code: z
    .string({ error: 'El código es obligatorio' })
    .length(6, 'El código debe tener exactamente 6 dígitos')
    .regex(/^\d{6}$/, 'El código solo puede contener dígitos'),
});

export type MFACodeInput = z.infer<typeof mfaCodeSchema>;
