import { supabase } from './supabase';

interface AuditUser {
  id: string;
  email?: string;
}

/**
 * Registra una acción en el audit log de Supabase.
 * @param user - currentUser del AuthContext
 * @param action - Descripción de la acción
 * @param details - Detalles adicionales opcionales
 */
export async function logAction(
  user: AuditUser | null | undefined,
  action: string,
  details = '',
): Promise<void> {
  if (!user) return;
  try {
    await supabase.from('audit_log').insert({
      user_id: user.id,
      user_email: user.email,
      action,
      details,
    });
  } catch {
    // El audit log nunca debe bloquear la app
  }
}
