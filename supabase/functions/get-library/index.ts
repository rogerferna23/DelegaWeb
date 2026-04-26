// /functions/get-library/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

serve(async (req: Request) => {
  const corsHeaders = buildCors(req);
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

    // Obtener imágenes
    const { data: images, error: imagesError } = await supabase
      .from("generated_images")
      .select("id, prompt, created_at, dimensions, quality, image_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Obtener videos
    const { data: videos, error: videosError } = await supabase
      .from("generated_videos")
      .select(
        "id, prompt, created_at, duration_seconds, status, video_url"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (imagesError || videosError) {
      throw imagesError || videosError;
    }

    // Combinar y formatear
    const creatives = [
      ...images.map((img) => ({
        id: img.id,
        type: "image",
        name: img.prompt.substring(0, 30) + (img.prompt.length > 30 ? "..." : ""),
        created_at: img.created_at,
        dimensions: img.dimensions,
        url: img.image_url,
      })),
      ...videos.map((vid) => ({
        id: vid.id,
        type: "video",
        name: vid.prompt.substring(0, 30) + (vid.prompt.length > 30 ? "..." : ""),
        created_at: vid.created_at,
        duration: vid.duration_seconds,
        status: vid.status,
        url: vid.video_url,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    return new Response(
      JSON.stringify({
        ok: true,
        total: creatives.length,
        creatives,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
