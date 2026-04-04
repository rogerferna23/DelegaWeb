// /functions/generate-image/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Validar input
const GenerateImageSchema = z.object({
  prompt: z.string().min(10).max(1000),
  dimensions: z.enum(["512x512", "1024x1024", "1792x1024"]).default("1024x1024"),
  quality: z.enum(["standard", "hd"]).default("hd"),
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
    // 1. Autenticar usuario
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
    const { prompt, dimensions, quality } = GenerateImageSchema.parse(body);

    // 3. Crear registro de request
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

    if (requestError) {
      throw requestError;
    }

    // 4. Llamar a DALL-E 3
    const dalleResponse = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: dimensions,
          quality: quality,
          style: "natural",
        }),
      }
    );

    if (!dalleResponse.ok) {
      const error = await dalleResponse.json();
      throw new Error(`DALL-E error: ${error.error.message}`);
    }

    const dalleData = await dalleResponse.json();
    const imageUrl = dalleData.data[0].url;
    const dalleRequestId = dalleData.data[0].revised_prompt;

    // 5. Guardar imagen en BD
    const { data: image, error: imageError } = await supabase
      .from("generated_images")
      .insert({
        user_id: user.id,
        request_id: request.id,
        image_url: imageUrl,
        dalle_request_id: dalleRequestId,
        prompt,
        dimensions,
        quality,
      })
      .select()
      .single();

    if (imageError) {
      throw imageError;
    }

    // 6. Actualizar request como completado
    await supabase
      .from("creative_requests")
      .update({
        status: "completed",
        result_id: image.id,
        completed_at: new Date(),
      })
      .eq("id", request.id);

    return new Response(
      JSON.stringify({
        ok: true,
        image: {
          id: image.id,
          url: imageUrl,
          prompt,
        },
      }),
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: error.errors }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.error("Error:", error);

    return new Response(
      JSON.stringify({ error: error.message || "Server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
