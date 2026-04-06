import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = [
  "https://delegaweb.com",
  "https://delega-web.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
];

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin || "") ? origin! : allowedOrigins[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";

    // 1. LIMITADOR DE RITMO (Upstash Redis)
    try {
      const upstashUrl = Deno.env.get("UPSTASH_URL");
      const upstashToken = Deno.env.get("UPSTASH_TOKEN");
      
      if (upstashUrl && upstashToken) {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 1500); // Bypass si Redis tarda > 1.5s
        
        const limitKey = `login_limit_${clientIP.replace(/:/g, '_')}`;
        const response = await fetch(`${upstashUrl}/incr/${limitKey}`, {
          headers: { Authorization: `Bearer ${upstashToken}` },
          signal: controller.signal
        });
        
        clearTimeout(tid);
        // Opcional: Podrías procesar 'response' para bloquear por IP si supera X intentos
      }
    } catch (e) {
      console.warn("[Limiter] Skipping due to error or timeout:", e.message);
    }

    // 2. AUTHENTICATION
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

    // 3. AUDIT LOG (Asíncrono)
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    edge_log(supabaseService, {
      user_id: data?.user?.id,
      email,
      status: error ? "failed" : "success",
      ip: clientIP,
      ua: req.headers.get("user-agent")
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

  } catch (error) {
    console.error("[Fatal Error]", error.message);
    return new Response(JSON.stringify({ error: "Error interno: " + error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

async function edge_log(client: any, { user_id, email, status, ip, ua }: any) {
  try {
    await client.from("activity_logs").insert({
      user_id: user_id || null,
      action: "login",
      status,
      severity: status === "success" ? "INFO" : "WARN",
      details: { email, ip, user_agent: ua },
      ip_address: ip
    });
  } catch (e) {
    console.error("Log error ignored:", e.message);
  }
}
