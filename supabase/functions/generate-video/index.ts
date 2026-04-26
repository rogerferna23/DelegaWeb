// /functions/generate-video/index.ts
//
// Generación de video vía FAL.ai (queue async). Devuelve un request_id
// que el frontend usa para hacer polling con check-video-status.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const falKey = Deno.env.get("FAL_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Mapeo: ID del catálogo (modelsData.ts) → modelo real de FAL.ai ──────────
const FAL_VIDEO_MODELS: Record<string, string> = {
  "seedance-2-0":     "fal-ai/bytedance/seedance/v1/lite/text-to-video",
  "seedance-1-5-pro": "fal-ai/bytedance/seedance/v1/pro/text-to-video",
  "kling-3-0-pro":    "fal-ai/kling-video/v2.1/pro/text-to-video",
  "kling-2-5-turbo":  "fal-ai/kling-video/v2.1/standard/text-to-video",
  "veo-3-1":          "fal-ai/veo3",
  "veo-3":            "fal-ai/veo3",
  "sora-2-pro":       "fal-ai/kling-video/v2.1/pro/text-to-video", // FAL no expone Sora; usamos Kling Pro
  "hailuo-2-3":       "fal-ai/minimax/video-01",
  "wan-2-5":          "fal-ai/wan-i2v",
  "pixverse-v5-6":    "fal-ai/pixverse/v4.5",
};
const FALLBACK_VIDEO_MODEL = "fal-ai/kling-video/v2.1/standard/text-to-video";

// Cada modelo de video acepta un set distinto de durations (todas como string).
// snapToAllowed elige el valor permitido más cercano al que pidió el usuario.
function snapToAllowed(duration: number, allowed: number[]): string {
  const closest = allowed.reduce((best, v) =>
    Math.abs(v - duration) < Math.abs(best - duration) ? v : best,
  allowed[0]);
  return String(closest);
}

function buildVideoBody(falModel: string, prompt: string, duration: number, aspectRatio: string) {
  const ar = aspectRatio || "16:9";

  if (falModel.includes("kling-video")) {
    return { prompt, duration: snapToAllowed(duration, [5, 10]), aspect_ratio: ar };
  }
  if (falModel.includes("minimax")) {
    return { prompt, prompt_optimizer: true };
  }
  if (falModel.includes("seedance")) {
    return { prompt, duration: snapToAllowed(duration, [5, 10]), aspect_ratio: ar, resolution: "1080p" };
  }
  if (falModel.includes("veo3")) {
    // Veo3 acepta '8s' como default; si el modelo soporta enum '15'|'30'|...
    // FAL los acepta como string. Snap al valor más cercano para evitar 422.
    return { prompt, aspect_ratio: ar, duration: snapToAllowed(duration, [15, 30, 45, 60]) };
  }
  if (falModel.includes("pixverse")) {
    return { prompt, aspect_ratio: ar, duration: snapToAllowed(duration, [5, 8]) };
  }
  // Modelos no conocidos: NO enviar duration para que FAL use su default y
  // evitar errores de tipo cuando el modelo espera un enum específico.
  return { prompt, aspect_ratio: ar };
}

const Schema = z.object({
  prompt: z.string().min(10).max(2000),
  modelId: z.string().default("kling-2-5-turbo"),
  duration: z.number().int().min(3).max(60).default(5),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).default("16:9"),
});

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

    const body = await req.json();
    const { prompt, modelId, duration, aspectRatio } = Schema.parse(body);
    const falModel = FAL_VIDEO_MODELS[modelId] ?? FALLBACK_VIDEO_MODEL;

    // 1. Crear request en BD
    const { data: request, error: requestError } = await supabase
      .from("creative_requests")
      .insert({ user_id: user.id, creative_type: "video", prompt, status: "processing" })
      .select()
      .single();
    if (requestError) throw requestError;

    // 2. Encolar en FAL.ai
    const falPayload = buildVideoBody(falModel, prompt, duration, aspectRatio);
    const falResponse = await fetch(`https://queue.fal.run/${falModel}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Key ${falKey}` },
      body: JSON.stringify(falPayload),
    });

    if (!falResponse.ok) {
      const errText = await falResponse.text();
      throw new Error(`FAL queue error (${falResponse.status}): ${errText}`);
    }
    const falData = await falResponse.json();
    const requestId = falData.request_id;
    if (!requestId) throw new Error("FAL no devolvió request_id");

    // 3. Guardar metadata en BD (reusamos runway_project_id para el FAL request_id)
    const { data: video, error: videoError } = await supabase
      .from("generated_videos")
      .insert({
        user_id: user.id,
        request_id: request.id,
        runway_project_id: requestId,
        model_id: falModel,
        prompt,
        duration_seconds: duration,
        status: "processing",
      })
      .select()
      .single();
    if (videoError) throw videoError;

    return new Response(
      JSON.stringify({
        ok: true,
        video: {
          id: video.id,
          fal_request_id: requestId,
          fal_model: falModel,
          status: "processing",
          message: "El video se está generando. Esto toma 1-5 minutos.",
        },
      }),
      { status: 201, headers: corsHeaders },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Invalid input", details: error.errors }), { status: 400, headers: corsHeaders });
    }
    console.error("generate-video error:", error);
    return new Response(JSON.stringify({ error: error.message || "Server error" }), { status: 500, headers: corsHeaders });
  }
});
