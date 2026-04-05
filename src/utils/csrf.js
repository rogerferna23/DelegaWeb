import { supabase } from '../lib/supabase';

/**
 * Obtiene un token CSRF de un solo uso desde la Edge Function.
 * Se debe llamar antes de realizar operaciones de escritura críticas (Post/Patch/Delete).
 */
export async function getCsrfToken() {
  try {
    const { data, error } = await supabase.functions.invoke('generate-csrf-token');
    if (error) {
      console.error('Error en Edge Function CSRF:', error);
      return null;
    }
    return data.token;
  } catch (err) {
    console.error('Error de red obteniendo CSRF token:', err);
    return null;
  }
}
