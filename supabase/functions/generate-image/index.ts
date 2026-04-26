// /functions/generate-image/index.ts
//
// Generación de imágenes a través de FAL.ai (todos los modelos del catálogo
// pasan por la misma cuenta de FAL — una sola API key, una sola recarga).

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const falKey = Deno.env.get("FAL_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Mapeo: ID del catálogo (modelsData.ts) → modelo real de FAL.ai ──────────
// Solo aquí se cambia para añadir/migrar modelos. Si llega un id no listado,
// se usa flux-schnell como fallback (rápido y barato).
const FAL_IMAGE_MODELS: Record<string, string> = {
  "recraft-v3":       "fal-ai/recraft-v3",
  "flux-2-pro":       "fal-ai/flux-pro/v1.1-ultra",
  "flux-1-1-pro":     "fal-ai/flux-pro/v1.1",
  "flux-schnell":     "fal-ai/flux/schnell",
  "flux-kontext-pro": "fal-ai/flux-pro/kontext",
  "nano-banana-2":    "fal-ai/imagen4/preview",
  "nano-banana-pro":  "fal-ai/imagen4/preview",
  "seedream-4-5":     "fal-ai/bytedance/seedream/v3/text-to-image",
  "gpt-image-1-5":    "fal-ai/flux-pro/v1.1",      // FAL no tiene gpt-image; usamos Flux Pro como equivalente
  "grok-imagine":     "fal-ai/flux/schnell",       // fallback económico
};
const FALLBACK_IMAGE_MODEL = "fal-ai/flux/schnell";

// Algunos modelos esperan "image_size" (presets) y otros "aspect_ratio".
// Esta función decide el formato según el modelo destino.
function buildSizeParams(falModel: string, aspectRatio: string) {
  // Modelos que usan image_size con presets de FAL
  if (falModel.startsWith("fal-ai/flux/") || falModel.startsWith("fal-ai/recraft")) {
    const sizeMap: Record<string, string> = {
      "1:1":  "square_hd",
      "16:9": "landscape_16_9",
      "9:16": "portrait_16_9",
      "4:3":  "landscape_4_3",
      "3:4":  "portrait_4_3",
    };
    return { image_size: sizeMap[aspectRatio] ?? "square_hd" };
  }
  // Modelos que aceptan aspect_ratio directo (Flux Pro v1.1, Imagen, Seedream)
  return { aspect_ratio: aspectRatio || "1:1" };
}

const Schema = z.object({
  prompt: z.string().min(10).max(2000),
  modelId: z.string().default("flux-schnell"),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).default("1:1"),
  numImages: z.number().int().min(1).max(4).default(1),
});

// Orígenes permitidos para CORS — bloquea llamadas desde otros dominios.
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
    // 1. Auth
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // 2. Validar input
    const body = await req.json();
    const { prompt, modelId, aspectRatio, numImages } = Schema.parse(body);
    const falModel = FAL_IMAGE_MODELS[modelId] ?? FALLBACK_IMAGE_MODEL;

    // 3. Crear request en BD
    const { data: request, error: requestError } = await supabase
      .from("creative_requests")
      .insert({
        user_id: user.id,
        creative_type: "image",
        prompt,
        status: "processing",
      })
      .select()
      .single();
    if (requestError) throw requestError;

    // 4. Llamar a FAL.ai (sync — las imágenes tardan 5-30s)
    const sizeParams = buildSizeParams(falModel, aspectRatio);
    const falResponse = await fetch(`https://fal.run/${falModel}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${falKey}`,
      },
      body: JSON.stringify({
        prompt,
        num_images: numImages,
        ...sizeParams,
      }),
    });

    if (!falResponse.ok) {
      const errText = await falResponse.text();
      throw new Error(`FAL error (${falResponse.status}): ${errText}`);
    }
    const falData = await falResponse.json();

    // FAL devuelve { images: [{ url }] } en la mayoría de modelos
    const images: Array<{ url: string }> = falData.images ?? [];
    if (images.length === 0) {
      throw new Error("FAL no devolvió imágenes");
    }
    const imageUrl = images[0].url;

    // 5. Guardar imagen en BD
    const { data: image, error: imageError } = await supabase
      .from("generated_images")
      .insert({
        user_id: user.id,
        request_id: request.id,
        image_url: imageUrl,
        dalle_request_id: modelId, // reusamos columna existente para guardar el modelo usado
        prompt,
        dimensions: aspectRatio,
        quality: "hd",
      })
      .select()
      .single();
    if (imageError) throw imageError;

    // 6. Marcar request como completado
    await supabase
      .from("creative_requests")
      .update({ status: "completed", result_id: image.id, completed_at: new Date() })
      .eq("id", request.id);

    return new Response(
      JSON.stringify({
        ok: true,
        image: { id: image.id, url: imageUrl, prompt, model: modelId },
      }),
      { status: 201, headers: corsHeaders },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Invalid input", details: error.errors }), { status: 400, headers: corsHeaders });
    }
    console.error("generate-image error:", error);
    return new Response(JSON.stringify({ error: error.message || "Server error" }), { status: 500, headers: corsHeaders });
  }
});
