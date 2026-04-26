// /functions/detect-suspicious-activity/index.ts
//
// Detecta actividad sospechosa para un usuario. Requiere JWT válido y que el
// usuario que llama coincida con `user_id` (o sea admin/superadmin).

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

serve(async (req) => {
  const corsHeaders = buildCors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // 1. JWT obligatorio — antes esto era endpoint público
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  // Validamos el token y obtenemos al usuario que llama
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  let user_id: string;
  try {
    const body = await req.json();
    user_id = body?.user_id;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400, headers: corsHeaders });
  }

  // 2. Solo el propio usuario o admin/superadmin pueden consultar a otro user
  if (user_id !== caller.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();
    const role = profile?.role ?? "";
    if (role !== "admin" && role !== "superadmin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }
  }

  const alerts: string[] = [];

  // R1: Fuerza bruta por usuario (>10 fallos/h)
  const { count: failCount } = await supabase
    .from("activity_logs")
    .select("*", { count: "exact" })
    .eq("user_id", user_id)
    .eq("status", "failed")
    .gt("created_at", new Date(Date.now() - 3600000).toISOString());
  if (failCount && failCount > 10) {
    alerts.push(`🚨 Fuerza bruta: ${failCount} fallos/hora detectados para el usuario ${user_id}`);
  }

  // R2: Cambio de IP sospechoso
  const { data: ipData } = await supabase.rpc("check_recent_ip_switches", { p_user_id: user_id });
  if (ipData?.suspicious) {
    alerts.push(`🚨 Cambio de IP detectado: ${ipData.old_ip} -> ${ipData.new_ip} (Posible robo de sesión)`);
  }

  // R3: Lecturas masivas (>50/min)
  const { count: readCount } = await supabase
    .from("activity_logs")
    .select("*", { count: "exact" })
    .eq("user_id", user_id)
    .eq("action", "read_library")
    .gt("created_at", new Date(Date.now() - 60000).toISOString());
  if (readCount && readCount > 50) {
    alerts.push(`🚨 Lecturas masivas: ${readCount}/min (Detectado posible scraping)`);
  }

  if (alerts.length > 0) {
    const webhookUrl = Deno.env.get("SECURITY_WEBHOOK_URL");
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: alerts.join("\n") }),
      });
    }
  }
  return new Response(JSON.stringify({ ok: true, alertCount: alerts.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
