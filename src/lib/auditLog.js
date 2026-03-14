import { supabase } from './supabase';

/**
 * Registra una acción en el audit log de Supabase.
 * @param {Object} user - currentUser del AuthContext
 * @param {string} action - Descripción de la acción
 * @param {string} details - Detalles adicionales opcionales
 */
export async function logAction(user, action, details = '') {
  if (!user) return;
  try {
    await supabase.from('audit_log').insert({
      user_id: user.id,
      user_email: user.email,
      action,
      details,
    });
  } catch (_) {
    // El audit log nunca debe bloquear la app
  }
}
