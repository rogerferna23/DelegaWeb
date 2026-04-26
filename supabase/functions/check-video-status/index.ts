// /functions/check-video-status/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const runwayKey = Deno.env.get("RUNWAY_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

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
    // Autenticar usuario
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

    const { videoId, runwayProjectId } = await req.json();

    if (!videoId || !runwayProjectId) {
      return new Response(
        JSON.stringify({ error: "videoId y runwayProjectId son requeridos" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Verificar que el video pertenece al usuario autenticado
    const { data: videoRecord, error: videoError } = await supabase
      .from("generated_videos")
      .select("id")
      .eq("id", videoId)
      .eq("user_id", user.id)
      .single();

    if (videoError || !videoRecord) {
      return new Response(
        JSON.stringify({ error: "Video no encontrado" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Consultar estado en Runway
    const runwayResponse = await fetch(
      `https://api.runwayml.com/v1/tasks/${runwayProjectId}`,
      {
        headers: {
          Authorization: `Bearer ${runwayKey}`,
        },
      }
    );

    const runwayData = await runwayResponse.json();

    // Mapear status de Runway al nuestro
    let status = "processing";
    let progress = 0;
    let videoUrl = null;

    if (runwayData.status === "SUCCEEDED") {
      status = "completed";
      progress = 100;
      videoUrl = runwayData.output?.[0]?.url ?? null;
    } else if (runwayData.status === "FAILED") {
      status = "failed";
    } else if (runwayData.status === "QUEUED") {
      progress = 10;
    } else if (runwayData.status === "IN_PROGRESS") {
      progress = runwayData.progress_percent || 50;
    }

    // Actualizar en BD
    const updateData: Record<string, unknown> = {
      status,
      progress_percent: progress,
    };

    if (videoUrl) {
      updateData.video_url = videoUrl;
      updateData.completed_at = new Date();
    }

    const { error: updateError } = await supabase
      .from("generated_videos")
      .update(updateData)
      .eq("id", videoId)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        status,
        progress,
        videoUrl,
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
