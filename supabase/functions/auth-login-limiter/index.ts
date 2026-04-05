import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = ["https://delegaweb.com", "http://localhost:5173", "http://localhost:5174"];

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin || "") ? origin! : "https://delegaweb.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
  };

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (origin && !allowedOrigins.includes(origin)) return new Response("Forbidden", { status: 403 });

  const { email, password } = await req.json();
  const clientIP = req.headers.get("x-forwarded-for") || "unknown";
  const limitKey = `limits:login:${email}:${clientIP}`;

  // Rate Limiting con degradación elegante
  try {
    const res = await fetch(
      `${Deno.env.get("UPSTASH_URL")}/incr/${limitKey}`,
      { headers: { Authorization: `Bearer ${Deno.env.get("UPSTASH_TOKEN")}` } }
    );
    const { result: attempts } = await res.json();
    if (attempts === 1) {
      await fetch(
        `${Deno.env.get("UPSTASH_URL")}/expire/${limitKey}/900`,
        { headers: { Authorization: `Bearer ${Deno.env.get("UPSTASH_TOKEN")}` } }
      );
    }
    if (attempts > 5) {
      return new Response(
        JSON.stringify({ error: "Demasiados intentos. Espera 15 min." }),
        { status: 429, headers: corsHeaders }
      );
    }
  } catch (e) {
    console.warn("Redis offline, saltando limitador...");
  }

  // Auth con ANON (respeta RLS)
  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
  // Logs con SERVICE (permisos elevados)
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

  await supabaseService.from("activity_logs").insert({
    user_id: data?.user?.id || null,
    action: "login",
    status: error ? "failed" : "success",
    severity: error ? "WARN" : "INFO",
    details: { email, ip: clientIP },
    ip_address: clientIP
  });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 401, headers: corsHeaders });
  return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
});
