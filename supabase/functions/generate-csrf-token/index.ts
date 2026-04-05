import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = ["https://delegaweb.com", "http://localhost:5173", "http://localhost:5174"];

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin || "") ? origin! : "https://delegaweb.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (origin && !allowedOrigins.includes(origin)) return new Response("Forbidden", { status: 403 });

  const authHeader = req.headers.get("Authorization");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader! } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  // Generar token aleatorio
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");

  // Guardar con expiración de 1 hora
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  await supabaseService.from("csrf_tokens").insert({
    user_id: user.id,
    token,
    expires_at: new Date(Date.now() + 3600000).toISOString()
  });

  return new Response(JSON.stringify({ csrf_token: token }), { headers: corsHeaders });
});
