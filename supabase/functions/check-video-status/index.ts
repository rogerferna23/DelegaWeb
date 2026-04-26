// /functions/check-video-status/index.ts
//
// Polling de status para videos generados con FAL.ai.
// El frontend llama a este endpoint cada N segundos hasta que el status
// pase a "completed" o "failed".

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const falKey = Deno.env.get("FAL_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

const ALLOWED_ORIGINS = [
  "https://delegaweb.com",
  "https://www.delegaweb.com",
  "https://delega-web.vercel.app",
  "http://localhost:5173",
];
function buildCors(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

serve(async (req: Request) => {
  const corsHeaders = buildCors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { videoId } = await req.json();
    if (!videoId) {
      return new Response(JSON.stringify({ error: "videoId requerido" }), { status: 400, headers: corsHeaders });
    }

    // Recuperar el video y verificar dueño
    const { data: video, error: videoError } = await supabase
      .from("generated_videos")
      .select("id, runway_project_id, model_id, status, video_url")
      .eq("id", videoId)
      .eq("user_id", user.id)
      .single();
    if (videoError || !video) {
      return new Response(JSON.stringify({ error: "Video no encontrado" }), { status: 404, headers: corsHeaders });
    }

    // Si ya estaba terminado, devuelve los datos sin volver a llamar a FAL
    if (video.status === "completed" && video.video_url) {
      return new Response(
        JSON.stringify({ ok: true, status: "completed", progress: 100, videoUrl: video.video_url }),
        { headers: corsHeaders },
      );
    }

    const falRequestId = video.runway_project_id; // reusamos columna
    const falModel = video.model_id;
    if (!falRequestId || !falModel) throw new Error("Video sin metadata FAL válida");

    // 1. Consultar status en FAL
    const statusResp = await fetch(
      `https://queue.fal.run/${falModel}/requests/${falRequestId}/status`,
      { headers: { Authorization: `Key ${falKey}` } },
    );
    if (!statusResp.ok) {
      const errText = await statusResp.text();
      throw new Error(`FAL status error (${statusResp.status}): ${errText}`);
    }
    const statusData = await statusResp.json();

    let status = "processing";
    let progress = 30;
    let videoUrl: string | null = null;

    if (statusData.status === "COMPLETED") {
      // 2. Obtener resultado final
      const resultResp = await fetch(
        `https://queue.fal.run/${falModel}/requests/${falRequestId}`,
        { headers: { Authorization: `Key ${falKey}` } },
      );
      if (!resultResp.ok) {
        const errText = await resultResp.text();
        throw new Error(`FAL result error (${resultResp.status}): ${errText}`);
      }
      const resultData = await resultResp.json();
      videoUrl = resultData.video?.url ?? resultData.output?.url ?? null;
      status = videoUrl ? "completed" : "failed";
      progress = 100;
    } else if (statusData.status === "IN_QUEUE") {
      progress = 15;
    } else if (statusData.status === "IN_PROGRESS") {
      progress = 60;
    } else if (statusData.status === "FAILED" || statusData.status === "ERROR") {
      status = "failed";
      progress = 0;
    }

    // 3. Actualizar BD
    const updateData: Record<string, unknown> = { status, progress_percent: progress };
    if (videoUrl) {
      updateData.video_url = videoUrl;
      updateData.completed_at = new Date();
    }
    await supabase
      .from("generated_videos")
      .update(updateData)
      .eq("id", videoId)
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({ ok: true, status, progress, videoUrl }),
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("check-video-status error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
