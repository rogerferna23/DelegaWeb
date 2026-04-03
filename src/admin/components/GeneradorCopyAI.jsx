import React, { useState } from 'react';
import { Sparkles, Minus, Plus, Search, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function GeneradorCopyAI({ onSelectCopy, context }) {
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setResults(null);

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

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          message: prompt,
          is_copy_generation: true // Flag para que el backend sepa que es una generación de copy
        }
      });

      if (error) throw error;

      // El backend debe devolver el JSON parseado en el campo 'message' o similar
      // Si el backend devuelve texto plano con el JSON dentro, lo parseamos
      let generated;
      if (typeof data.message === 'string') {
        const jsonMatch = data.message.match(/\[[\s\S]*\]/);
        generated = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } else {
        generated = data.message || [];
      }

      setResults(generated);
    } catch (err) {
      console.error('Error generando copy:', err);
      alert('Hubo un error al generar los textos. Por favor intenta de nuevo.');
    } finally {
      setIsGenerating(false);
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
      {!isOpen && !results && (
        <button 
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-sm font-medium transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Generar copy con IA
        </button>
      )}

      {/* Popover de Configuración */}
      {isOpen && !results && !isGenerating && (
        <div className="mt-2 p-4 bg-background border border-white/10 rounded-xl shadow-lg max-w-sm inline-block">
          <div className="text-sm text-gray-300 font-medium mb-3">¿Cuántas variaciones deseas generar?</div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center bg-cardbg border border-white/10 rounded-lg">
              <button 
                type="button"
                onClick={() => setCount(Math.max(1, count - 1))}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="w-8 text-center text-white font-medium text-sm">{count}</div>
              <button 
                type="button"
                onClick={() => setCount(Math.min(5, count + 1))}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-gray-500">(Máximo 5)</span>
          </div>
          
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-3 py-2 bg-cardbg hover:bg-white/5 border border-white/5 text-gray-400 rounded-lg text-sm transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={handleGenerate}
              className="flex-1 px-3 py-2 bg-primary hover:bg-primaryhover text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generar
            </button>
          </div>
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
               onClick={() => { setResults(null); setCount(3); }} 
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
