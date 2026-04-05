import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://delegaweb.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SecretSchema = z.object({
  action: z.enum(["save", "get"]),
  service: z.string().min(2),
  value: z.string().min(1).optional()
});

async function getCryptoKey(keyStr: string) {
  if (keyStr.length !== 32) throw new Error("Encryption key must be 32 bytes");
  return await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(keyStr),
    "AES-GCM", false, ["encrypt", "decrypt"]
  );
}

async function encrypt(text: string, keyStr: string) {
  const key = await getCryptoKey(keyStr);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key,
    new TextEncoder().encode(text)
  );
  return btoa(JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  }));
}

async function decrypt(cipherJson: string, keyStr: string) {
  const { iv, data } = JSON.parse(atob(cipherJson));
  const key = await getCryptoKey(keyStr);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key, new Uint8Array(data)
  );
  return new TextDecoder().decode(decrypted);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.headers.get("origin") !== "https://delegaweb.com") return new Response("Forbidden", { status: 403 });

  try {
    // JWT Verification
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { action, service, value } = SecretSchema.parse(body);
    const encKey = Deno.env.get("ENCRYPTION_KEY")!;

    if (action === "get") {
      const { data } = await supabase
        .from("encrypted_secrets")
        .select("encrypted_value")
        .eq("user_id", user.id)
        .eq("secret_type", service)
        .single();
      if (!data) return new Response("Not found", { status: 404, headers: corsHeaders });
      const decrypted = await decrypt(data.encrypted_value, encKey);
      return new Response(JSON.stringify({ value: decrypted }), { headers: corsHeaders });
    }

    if (action === "save") {
      if (!value) return new Response(
        JSON.stringify({ error: "value required" }),
        { status: 400, headers: corsHeaders }
      );
      const encrypted = await encrypt(value, encKey);
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { error } = await supabaseService
        .from("encrypted_secrets")
        .upsert({
          user_id: user.id,
          secret_type: service,
          encrypted_value: encrypted
        }, { onConflict: "user_id,secret_type" });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
  }
});
