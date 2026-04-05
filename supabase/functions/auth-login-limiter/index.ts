import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = ["https://delegaweb.com", "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"];

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin || "") ? origin! : "https://delegaweb.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
  };

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  // CORS check on all other methods
  if (origin && !allowedOrigins.includes(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), { 
      status: 403, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  const { email, password } = await req.json();
  const clientIP = req.headers.get("x-forwarded-for") || "unknown";
  const limitKey = `limits:login:${email}:${clientIP}`;

  // Rate Limiting con timeout y degradación elegante
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos max para Redis

    const res = await fetch(
      `${Deno.env.get("UPSTASH_URL")}/incr/${limitKey}`,
      { 
        headers: { Authorization: `Bearer ${Deno.env.get("UPSTASH_TOKEN")}` },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    
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
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.warn("Redis issue or timeout, skipping limiter:", e.message);
  }

  // Auth con cliente ANON (respeta RLS)
  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

  // Logs asíncronos con SERVICE_ROLE para auditoría
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // No bloqueamos la respuesta esperando el log
  supabaseService.from("activity_logs").insert({
    user_id: data?.user?.id || null,
    action: "login",
    status: error ? "failed" : "success",
    severity: error ? "WARN" : "INFO",
    details: { email, ip: clientIP, user_agent: req.headers.get("user-agent") },
    ip_address: clientIP
  }).then(({ error: logErr }) => {
    if (logErr) console.error("Log error:", logErr);
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 401, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  return new Response(JSON.stringify(data), { 
    status: 200, 
    headers: { ...corsHeaders, "Content-Type": "application/json" } 
  });
});

