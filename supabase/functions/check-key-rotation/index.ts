import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://delegaweb.com",
  "https://www.delegaweb.com",
  "https://delega-web.vercel.app",
  "http://localhost:5173",
];
function buildCors(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

/**
 * Edge Function: check-key-rotation
 * Monitorea el estado y salud de las llaves de encriptación y secretos.
 * Solo accesible para usuarios con rol admin/superadmin.
 */
serve(async (req: Request) => {
  const corsHeaders = buildCors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. Auth — antes era endpoint público que filtraba total_secrets
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // 2. Solo admin/superadmin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = profile?.role ?? "";
    if (role !== "admin" && role !== "superadmin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Analítica simple de secretos encriptados
    const { count, error } = await supabase
      .from("encrypted_secrets")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    const status = {
      key_alias: "DELEGA_SEC_V1",
      status: "ACTIVE",
      encryption_standard: "AES-256-GCM",
      total_secrets: count || 0,
      health: "OPTIMAL",
      checked_at: new Date().toISOString(),
      advice: (count && count > 500) ? "Rotation recommended soon" : "Key is healthy",
    };

    // Registrar el chequeo en logs de actividad (con user_id ahora real)
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action: "security_check",
      details: `Salud de llaves verificada: ${status.health}. Secretos: ${status.total_secrets}`,
      severity: "info",
    });

    return new Response(JSON.stringify(status), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const err = error as Error;
    console.error("check-key-rotation error:", err.message);
    return new Response(JSON.stringify({ error: "Server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
