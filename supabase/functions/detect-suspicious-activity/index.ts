import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { user_id } = await req.json();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
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

  // R2: Cambio de IP sospechoso (usa la función SQL check_recent_ip_switches)
  const { data: ipData } = await supabase.rpc("check_recent_ip_switches", {
    p_user_id: user_id
  });
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
        body: JSON.stringify({ text: alerts.join("\n") })
      });
    }
  }
  return new Response("Security scan complete");
});
