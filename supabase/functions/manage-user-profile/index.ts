import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://delegaweb.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function getCryptoKey(keyStr: string) {
  if (keyStr.length !== 32) throw new Error("Encryption key must be 32 bytes");
  return await crypto.subtle.importKey("raw", new TextEncoder().encode(keyStr), "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encrypt(text: string, keyStr: string) {
  const key = await getCryptoKey(keyStr);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
  return btoa(JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
}

async function decrypt(cipherJson: string, keyStr: string) {
  const { iv, data } = JSON.parse(atob(cipherJson));
  const key = await getCryptoKey(keyStr);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, new Uint8Array(data));
  return new TextDecoder().decode(decrypted);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.headers.get("origin") !== "https://delegaweb.com") return new Response("Forbidden", { status: 403 });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { action, phone } = await req.json();
    const encKey = Deno.env.get("ENCRYPTION_KEY")!;

    if (action === "save_phone") {
      const encrypted = await encrypt(phone, encKey);
      const { error } = await supabase
        .from("user_profiles")
        .update({ phone_number_encrypted: encrypted })
        .eq("id", user.id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    if (action === "get_phone") {
      const { data } = await supabase
        .from("user_profiles")
        .select("phone_number_encrypted")
        .eq("id", user.id)
        .single();
      if (!data?.phone_number_encrypted) {
        return new Response(JSON.stringify({ phone: null }), { headers: corsHeaders });
      }
      const decrypted = await decrypt(data.phone_number_encrypted, encKey);
      return new Response(JSON.stringify({ phone: decrypted }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
  }
});
