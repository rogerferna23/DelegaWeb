import React, { useState } from 'react';
import { Sparkles, Minus, Plus, Search, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useJob } from '../../contexts/BackgroundJobsContext';

export default function GeneradorCopyAI({ onSelectCopy, context }) {

  const [count, setCount] = useState(3);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // El generador de copy vive dentro del wizard de NuevaCampana. Si el usuario
  // navega a otra sección mientras la IA redacta las variaciones, el job sigue
  // vivo y, al volver, los textos ya están listos para elegir.
  const copyJob = useJob('nuevacampana:generador-copy');
  const isGenerating = copyJob.isRunning;
  const results = copyJob.result || null;

  const handleGenerate = async () => {
    const prompt = `Actúa como un experto en Copywriting para Meta Ads.
Genera ${count} variaciones de copy para una campaña de anuncios.
CONTEXTO DEL NEGOCIO:
- Empresa/Producto: ${context?.offer || 'Servicios profesionales'}
- Cliente Ideal: ${context?.client || 'Público general'}
- Valor Diferencial: ${context?.diff || 'Excelente servicio'}
- Rango de Precio: ${context?.price || 'Standard'}

REQUERIMIENTOS:
- Idioma: Español.
- Tono: Persuasivo pero profesional.
- Estructura: Cada variación debe incluir Framework (AIDA, PAS o Beneficios), Texto Principal (Primary Text), Título (Headline) y Descripción corta.
- Formato: Devuelve un JSON válido que sea un array de objetos con las llaves: framework, primary_text, headline, description, cta.

NO incluyas explicaciones, solo el JSON.`;

    try {
      await copyJob.start(
        async () => {
          const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: { message: prompt, is_copy_generation: true },
          });

          if (error) {
            console.error('Error invocando Edge Function:', error);
            let detailedError = error.message;
            if (error.context && typeof error.context.text === 'function') {
              const text = await error.context.text();
              detailedError = `${error.message}: ${text}`;
            }
            throw new Error(`Error de conexión con la IA: ${detailedError}`);
          }

          if (data?.error) throw new Error(data.error);
          if (!data || !data.message) throw new Error('La IA no devolvió ninguna respuesta.');

          let generated = [];
          try {
            if (typeof data.message === 'string') {
              const jsonMatch = data.message.match(/\[[\s\S]*\]/);
              const cleanJson = jsonMatch ? jsonMatch[0] : data.message;
              generated = JSON.parse(cleanJson);
            } else {
              generated = data.message || [];
            }
            if (!Array.isArray(generated)) {
              generated = [generated];
            }
          } catch (parseErr) {
            console.error('Error parseando JSON de IA:', parseErr, data.message);
            throw new Error('El formato de respuesta de la IA no es válido. Prueba de nuevo.');
          }

          return generated;
        },
        { label: `Copy IA: ${count} variaciones` }
      );
    } catch (err) {
      console.error('Error completo en GeneradorCopyAI:', err);
      // El error ya quedó en el job; lo mostrará el indicador global.
    }
  };

  const handleSelect = (index) => {
    setSelectedIndex(index);
    if (onSelectCopy) {
      onSelectCopy(results[index]);
    }
  };

  return (
    <div className="relative mt-2">
      {/* Selector de Configuración Directo */}
      {!results && !isGenerating && (
        <div className="mt-2 p-5 bg-background/50 border border-white/10 rounded-2xl shadow-xl max-w-md">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
               <Sparkles className="w-4 h-4 text-primary" />
             </div>
             <div>
               <h3 className="text-sm font-bold text-white">¿Cuántas variaciones deseas generar?</h3>
               <p className="text-[10px] text-gray-500">Claude redactará opciones basadas en tu contexto.</p>
             </div>
          </div>
          
          <div className="flex items-center gap-6 mb-5">
            <div className="flex items-center bg-cardbg border border-white/10 rounded-xl p-1">
              <button 
                type="button"
                onClick={() => setCount(Math.max(1, count - 1))}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="w-10 text-center text-white font-bold text-base">{count}</div>
              <button 
                type="button"
                onClick={() => setCount(Math.min(5, count + 1))}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="text-[10px] text-gray-400 italic">Máximo 5 por cada solicitud</div>
          </div>
          
          <button 
            type="button"
            onClick={handleGenerate}
            disabled={!context?.offer}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg
              ${!context?.offer ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-primaryhover text-white shadow-primary/20'}`}
          >
            <Sparkles className="w-4 h-4" />
            Generar Estrategia de Copy
          </button>
          {!context?.offer && (
            <p className="text-[10px] text-orange-500 mt-2 text-center">⚠ Completa el Contexto (Paso 1) primero</p>
          )}
        </div>
      )}

      {/* Cargando */}
      {isGenerating && (
        <div className="mt-2 p-4 bg-background border border-white/10 rounded-xl max-w-sm inline-flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <div className="text-sm text-gray-400">Claude está redactando los textos...</div>
        </div>
      )}

      {/* Resultados */}
      {results && !isGenerating && (
        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-300 font-medium">Variaciones generadas:</span>
            <button
               type="button"
               onClick={() => { copyJob.clear(); setCount(3); setSelectedIndex(null); }}
               className="text-xs text-primary hover:text-orange-400"
            >
              Regenerar
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((res, index) => {
              const isSelected = selectedIndex === index;
              return (
                <div 
                  key={index} 
                  onClick={() => handleSelect(index)}
                  className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-primary/5 border-primary shadow-[0_0_15px_rgba(249,115,22,0.15)]' 
                      : 'bg-cardbg border-white/5 hover:border-white/20'
                  }`}
                >
                  {isSelected && (
                     <div className="absolute top-3 right-3 text-primary">
                       <CheckCircle2 className="w-5 h-5" />
                     </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-white/10 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Opción {index + 1}</span>
                    <span className="text-xs text-primary font-medium">Framework: {res.framework}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">Texto principal</div>
                      <div className="text-xs text-gray-300 line-clamp-3 leading-relaxed">{res.primary_text}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">Headline</div>
                      <div className="text-xs text-white font-medium">{res.headline}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
