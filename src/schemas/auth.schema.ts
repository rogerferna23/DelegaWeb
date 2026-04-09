import { z } from 'zod';

// ─── Login ───────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El email es obligatorio' })
    .email('El formato del email no es válido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Add Admin ───────────────────────────────────────────────────────────────

export const addAdminSchema = z.object({
  name: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre es demasiado largo'),
  email: z
    .string({ required_error: 'El email es obligatorio' })
    .email('El formato del email no es válido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['admin', 'superadmin'], {
    required_error: 'El rol es obligatorio',
    invalid_type_error: 'Rol no válido',
  }),
});

export type AddAdminInput = z.infer<typeof addAdminSchema>;

// ─── MFA Verify ──────────────────────────────────────────────────────────────

export const mfaCodeSchema = z.object({
  code: z
    .string({ required_error: 'El código es obligatorio' })
    .length(6, 'El código debe tener exactamente 6 dígitos')
    .regex(/^\d{6}$/, 'El código solo puede contener dígitos'),
});

export type MFACodeInput = z.infer<typeof mfaCodeSchema>;
