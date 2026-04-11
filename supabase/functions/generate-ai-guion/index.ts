// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No autorizado: Sin token');
    }

    const { systemPrompt, userPrompt } = await req.json();

    if (!systemPrompt || !userPrompt) {
      throw new Error('Faltan prompts requeridos (systemPrompt, userPrompt)');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    // Extraer el token puro (quitando "Bearer ")
    const token = authHeader.replace("Bearer ", "");

    // Autenticación de usuario explícita
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error(`No autorizado: Sesión inválida (${authError?.message || 'NULL'})`);
    }

    // Configuración de API Keys
    const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');
    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    // Recuperar Preferencia de Modelo
    const { data: userPref } = await supabase
      .from('user_preferences')
      .select('preferred_claude_model')
      .eq('user_id', user.id)
      .maybeSingle();
    
    let modelToUse = userPref?.preferred_claude_model || 'claude-sonnet-4-6';
    let provider = modelToUse.startsWith('gpt-') ? 'openai' : 'anthropic';

    // FALLBACK INTELIGENTE: Si falta la clave del proveedor elegido, cambiamos al otro
    if (provider === 'anthropic' && !ANTHROPIC_KEY) {
      console.warn("Fallback: No hay ANTHROPIC_KEY, saltando a OpenAI");
      provider = 'openai';
      modelToUse = 'gpt-4o'; // Usar el mejor disponible
    } else if (provider === 'openai' && !OPENAI_KEY) {
      console.warn("Fallback: No hay OPENAI_KEY, saltando a Anthropic");
      provider = 'anthropic';
      modelToUse = 'claude-3-5-sonnet-20241022';
    }

    let fullText = '';
    let usage = { input_tokens: 0, output_tokens: 0 };

    if (provider === 'openai') {
      // LLAMADA A OPENAI
      if (!OPENAI_KEY) throw new Error("Falta OPENAI_API_KEY en las variables de entorno");
      
      // Mapeo seguro de modelos de OpenAI
      // El usuario confirma que usa GPT-5.4
      const finalModel = 
        modelToUse === 'gpt-5-4' ? 'gpt-5.4' : 
        modelToUse === 'gpt-5-4-mini' ? 'gpt-5.4-mini' : 
        modelToUse;

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: finalModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.85,
          max_tokens: 4096,
        })
      });

      if (!openaiResponse.ok) {
        const err = await openaiResponse.text();
        throw new Error(`OpenAI API Error: ${err}`);
      }

      const openaiData = await openaiResponse.json();
      fullText = openaiData.choices[0].message.content;
      usage = { 
        input_tokens: openaiData.usage.prompt_tokens, 
        output_tokens: openaiData.usage.completion_tokens 
      };
    } else {
      // LLAMADA A ANTHROPIC (CLAUDE)
      if (!ANTHROPIC_KEY) throw new Error("Falta ANTHROPIC_API_KEY en las variables de entorno");

      // Mapeo seguro de modelos de Anthropic (Basado en la lista actual del usuario)
      const finalModel = 
        modelToUse === 'claude-sonnet-4-6' ? 'claude-sonnet-4-6' : 
        modelToUse === 'claude-haiku-4-5-20251001' ? 'claude-haiku-4-5-20251001' :
        modelToUse === 'claude-opus-4-6' ? 'claude-opus-4-6' : 'claude-sonnet-4-6';

      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: finalModel,
          max_tokens: 4096,
          temperature: 0.85,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        })
      });

      if (!anthropicResponse.ok) {
         const errResponse = await anthropicResponse.text();
         throw new Error(`Anthropic API Error: ${errResponse}`);
      }

      const anthropicData = await anthropicResponse.json();
      fullText = anthropicData.content.find((c: any) => c.type === 'text')?.text || '';
      usage = { 
        input_tokens: anthropicData.usage.input_tokens, 
        output_tokens: anthropicData.usage.output_tokens 
      };
    }

    // Registrar uso
    await supabase.from('ai_usage_log').insert({
       user_id: user.id,
       endpoint: '/v1/messages (ai-guion)',
       input_tokens: usage.input_tokens,
       output_tokens: usage.output_tokens,
       model: modelToUse
    });

    // Limpiar respuesta para asegurar JSON válido si viene con backticks
    let cleanedJsonText = fullText.trim();
    if (cleanedJsonText.startsWith('```json')) {
      cleanedJsonText = cleanedJsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedJsonText.startsWith('```')) {
      cleanedJsonText = cleanedJsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Retorno final de respuesta
    return new Response(JSON.stringify({ 
      result: cleanedJsonText, 
      usage: usage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Error desconocido' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
