import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Usamos localStorage (el default de Supabase) para que la sesión sobreviva
// a F5 y a navegaciones entre pestañas/ventanas. Antes se usaba
// sessionStorage pensando en "limpiar al cerrar la pestaña", pero eso
// interactúa mal con algunos navegadores con protecciones estrictas
// (Brave Shields, Firefox Enhanced Tracking Protection) que pueden
// vaciar sessionStorage en ciertos escenarios, haciendo que F5 cierre
// la sesión. La seguridad la delegamos al expiry del JWT de Supabase
// (access token de 1h + refresh token rotatorio) y al timer de
// inactividad de AdminLayout.

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
});
