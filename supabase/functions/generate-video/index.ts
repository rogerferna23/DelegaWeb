// /functions/generate-video/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const runwayKey = Deno.env.get("RUNWAY_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

const GenerateVideoSchema = z.object({
  prompt: z.string().min(10).max(1000),
  duration: z.enum(["15", "30", "45", "60"]).default("30"),
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
    // 1. Autenticar
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

    // 2. Validar input
    const body = await req.json();
    const { prompt, duration } = GenerateVideoSchema.parse(body);

    // 3. Crear request en BD
    const { data: request, error: requestError } = await supabase
      .from("creative_requests")
      .insert({
        user_id: user.id,
        creative_type: "video",
        prompt,
        status: "processing",
      })
      .select()
      .single();

    if (requestError) {
      throw requestError;
    }

    // 4. Llamar a Runway ML API
    const runwayResponse = await fetch(
      "https://api.runwayml.com/v1/tasks",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${runwayKey}`,
        },
        body: JSON.stringify({
          type: "gen3a_turbo",
          input: {
            prompt_text: prompt,
            duration: parseInt(duration),
          },
        }),
      }
    );

    if (!runwayResponse.ok) {
      const error = await runwayResponse.json();
      throw new Error(`Runway error: ${error.message}`);
    }

    const runwayData = await runwayResponse.json();
    const projectId = runwayData.id;

    // 5. Guardar en BD
    const { data: video, error: videoError } = await supabase
      .from("generated_videos")
      .insert({
        user_id: user.id,
        request_id: request.id,
        runway_project_id: projectId,
        prompt,
        duration_seconds: parseInt(duration),
        status: "processing",
      })
      .select()
      .single();

    if (videoError) {
      throw videoError;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        video: {
          id: video.id,
          runway_project_id: projectId,
          status: "processing",
          message: "El video se está generando. Esto toma 2-5 minutos.",
        },
      }),
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
