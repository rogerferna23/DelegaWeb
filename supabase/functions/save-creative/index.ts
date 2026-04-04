// /functions/save-creative/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

const SaveCreativeSchema = z.object({
  creative_id: z.string().uuid(),
  creative_type: z.enum(["image", "video"]),
  name: z.string().min(3).max(100),
});

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Autenticar
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Validar input
    const body = await req.json();
    const { creative_id, creative_type, name } =
      SaveCreativeSchema.parse(body);

    // Guardar en biblioteca
    const { data, error } = await supabase
      .from("creative_library")
      .insert({
        user_id: user.id,
        creative_id,
        creative_type,
        name,
        saved_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Guardado en tu biblioteca",
        data,
      }),
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
