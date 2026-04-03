import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, campaign_id, is_copy_generation } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // Autenticación de usuario
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autorizado');

    // 1. Obtener Historial (Últimos 20 Mensajes)
    const { data: historyData } = await supabase
      .from('ai_chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
      
    // Anthropic espera el historial en orden cronológico (ancianos primero)
    const formattedHistory = (historyData || []).reverse().map(msg => ({
      role: msg.role === 'system' ? 'assistant' : msg.role, 
      content: msg.content
    }));

    // 2. Extraer contexto estadístico en vivo de la DB (Últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateLimit = sevenDaysAgo.toISOString().split('T')[0];

    const { data: campaigns } = await supabase
       .from('campaigns_cache')
       .select('id, name, status, daily_budget, campaign_insights(spend, messages, ctr, cost_per_message)')
       .eq('user_id', user.id)
       .gte('campaign_insights.date', dateLimit);

    let metricsContext = '';

    if (campaigns && campaigns.length > 0) {
       metricsContext = campaigns.map(c => {
         const insights = c.campaign_insights || [];
         const totalSpend = insights.reduce((acc, curr) => acc + (curr.spend || 0), 0);
         const totalMsgs = insights.reduce((acc, curr) => acc + (curr.messages || 0), 0);
         const avgCtr = insights.length ? insights.reduce((acc, curr) => acc + (curr.ctr || 0), 0) / insights.length : 0;
         const avgCpm = totalMsgs > 0 ? (totalSpend / totalMsgs).toFixed(2) : 0;
         
         return `- Campaña [${c.id}]: "${c.name}" | Estado: ${c.status} | Presup.: $${c.daily_budget} | Gasto: $${totalSpend} | Msjs: ${totalMsgs} | CPM: $${avgCpm} | CTR: ${avgCtr.toFixed(2)}%`;
       }).join('\n');
    }

    if (campaign_id) {
       metricsContext = `[CAMPAÑA EN VISTA ACTUAL: ${campaign_id}]\n\n` + metricsContext;
    }

    // 2.5 Extraer Contexto del Negocio
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    let businessContext = '';
    if (businessProfile) {
      businessContext = `
[CONTEXTO DEL NEGOCIO]
- Empresa: ${businessProfile.company_name}
- Oferta: ${businessProfile.offer}
- Cliente Ideal: ${businessProfile.ideal_client}
- Diferencial: ${businessProfile.differentiator || 'N/A'}
- Rango de Precio: ${businessProfile.price_range}
- Método de Cierre: ${businessProfile.sales_method}
`;
    }

    // 3. Generar System Prompt Integral
    const systemPrompt = `Eres el asistente experto en Meta Ads de DelegaWeb.
Tus recomendaciones son ESTRATÉGICAS y no ejecutas cambios directamente en la API (Modo Solo Lectura).

${businessContext || 'Contexto de Negocio: Gestión de tráfico hacia WhatsApp/Web.'}

[REGLAS MAESTRAS]
1. Responde siempre en español de forma concisa y profesional.
2. Basa tus consejos en los datos reales de campañas proporcionados.
3. El estándar (Benchmark) para LATAM: CPM $1-$3, CTR > 1%, Frecuencia < 3.
4. Si el usuario te pide crear o modificar algo, explícale que debe hacerlo manualmente en Meta Ads Manager y dale los pasos específicos.

[DATOS ACTUALES DE CAMPAÑAS]
${metricsContext || 'No hay datos de campañas registrados.'}
[FIN DE DATOS]
`;

    // 4. Solicitar Predicción a Claude
    formattedHistory.push({ role: 'user', content: message });

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get('ANTHROPIC_API_KEY')!,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
         model: "claude-3-5-sonnet-20240620",
         max_tokens: 1540,
         system: is_copy_generation ? "Eres un redactor creativo experto en Meta Ads. Genera solo el JSON solicitado sin explicaciones." : systemPrompt,
         messages: is_copy_generation ? [{ role: 'user', content: message }] : formattedHistory
      })
    });

    if (!anthropicResponse.ok) {
       const errResponse = await anthropicResponse.text();
       throw new Error(`Anthropic API Error: ${errResponse}`);
    }

    const anthropicData = await anthropicResponse.json();
    const fullText = anthropicData.content.find((c: any) => c.type === 'text')?.text || '';
    
    // Registro de Consumo
    const usage = anthropicData.usage || { input_tokens: 0, output_tokens: 0 };
    await supabase.from('ai_usage_log').insert({
       user_id: user.id,
       endpoint: '/v1/messages',
       input_tokens: usage.input_tokens,
       output_tokens: usage.output_tokens,
       model: "claude-3-5-sonnet-20240620"
    });

    // 5. Preparar Mensaje para el Chat (Sin parseo de acciones ya que estamos en Read-Only)
    let visibleMessage = fullText;

    // 6. Almacenar interacciones en memoria (Historial)
    const contextField = campaign_id ? { campaign_id } : {};
    
    await supabase.from('ai_chat_messages').insert([
        { user_id: user.id, role: 'user', content: message, context: contextField },
        { user_id: user.id, role: 'assistant', content: visibleMessage, context: contextField }
    ]);

    // Retorno final de respuesta
    return new Response(JSON.stringify({ 
      message: visibleMessage, 
      usage: usage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
