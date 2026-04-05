import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://delegaweb.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
};

const FullCampaignSchema = z.object({
  name: z.string().min(3).max(100).transform(s => s.replace(/<[^>]*>?/gm, '')),
  business_profile_id: z.string().uuid(),
  objective: z.string(),
  daily_budget: z.number().positive(),
  audience_age_min: z.number().min(13),
  audience_age_max: z.number().max(65),
  locations: z.array(z.string()),
  interests: z.array(z.string()),
  gender: z.string(),
  primary_text: z.string(),
  headline: z.string(),
  cta: z.string()
});

async function validateCsrf(req: Request, userId: string): Promise<boolean> {
  const token = req.headers.get("X-CSRF-Token");
  if (!token) return false;

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data } = await supabaseService
    .from("csrf_tokens")
    .select("id")
    .eq("user_id", userId)
    .eq("token", token)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!data) return false;

  // Marcar como usado (single-use)
  await supabaseService
    .from("csrf_tokens")
    .update({ used: true })
    .eq("id", data.id);

  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.headers.get("origin") !== "https://delegaweb.com") return new Response("Forbidden", { status: 403 });

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    // Validar CSRF
    const csrfValid = await validateCsrf(req, user.id);
    if (!csrfValid) return new Response(JSON.stringify({ error: "CSRF token invalid" }), { status: 403, headers: corsHeaders });

    const body = await req.json();
    const validated = FullCampaignSchema.parse(body);

    const { data, error } = await supabase
      .from("campaigns")
      .insert({ ...validated, user_id: user.id })
      .select();
    if (error) throw error;

    return new Response(JSON.stringify(data), { headers: corsHeaders });
  } catch (err) {
    const message = err instanceof z.ZodError ? "Invalid Input" : err.message;
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: corsHeaders });
  }
});
