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
    const { videoId, runwayProjectId } = await req.json();

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
      videoUrl = runwayData.output[0]?.url; 
    } else if (runwayData.status === "FAILED") {
      status = "failed";
    } else if (runwayData.status === "QUEUED") {
      progress = 10;
    } else if (runwayData.status === "IN_PROGRESS") {
      progress = runwayData.progress_percent || 50;
    }

    // Actualizar en BD
    const updateData: any = {
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
      .eq("id", videoId);

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
