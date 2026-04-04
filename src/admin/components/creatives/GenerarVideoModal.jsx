import React, { useState } from 'react';
import { 
  Video, Sparkles, Clock, PlayCircle, 
  ChevronLeft, Wand2, Loader2, Info, AlertCircle, RefreshCw
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import VideoProcessing from './VideoProcessing';

export default function GenerarVideoModal({ onBack, initialPrompt = '' }) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [duration, setDuration] = useState('15');
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskInfo, setTaskInfo] = useState(null); // { id, runway_project_id }

  const handleGenerate = async () => {
    if (!prompt || prompt.length < 10) return;

    try {
      setIsGenerating(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ prompt, duration }),
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error);

      setTaskInfo(data.video);
    } catch (err) {
      console.error('Error generating video:', err);
      alert('Error: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (taskInfo) {
    return (
      <VideoProcessing 
        videoId={taskInfo.id} 
        runwayProjectId={taskInfo.runway_project_id} 
        onBack={onBack} 
      />
    );
  }

  return (
    <div className="animate-in slide-in-from-right-4 duration-400">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-primary mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Volver a Creativos
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="bg-cardbg border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[120px] -mr-40 -mt-40"></div>
          
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-6 group-hover:scale-110 transition-transform">
              <Video className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Generador de Video Pro</h2>
            <p className="text-gray-500 text-sm max-w-md leading-relaxed">
              Crea contenido audiovisual de impacto con tecnología de Runway ML. Ideal para anuncios de Meta e historias de alto impacto.
            </p>
          </div>

          <div className="space-y-10 relative">
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Describe la escena</label>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full text-[10px] text-gray-400">
                  <Sparkles className="w-3 h-3 text-primary" /> Sugerencia de IA activa
                </div>
              </div>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: Un primer plano de un café vertiéndose en una taza con leche, estilo cinematográfico, luz solar, cámara lenta..."
                className="w-full bg-background border border-white/8 rounded-[30px] p-6 text-base text-white placeholder:text-gray-700 focus:outline-none focus:border-orange-500/40 min-h-[160px] transition-all resize-none shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Duración del Clip</label>
                <div className="grid grid-cols-4 gap-3">
                  {['15', '30', '45', '60'].map(d => (
                    <button 
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        duration === d ? 'bg-orange-500/10 border-orange-500 text-orange-400' : 'bg-background border-white/5 text-gray-500 hover:border-white/10'
                      }`}
                    >
                      <span className="font-bold text-sm tracking-tight">{d}s</span>
                      <Clock className="w-3 h-3 opacity-50" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <div className="p-5 bg-white/5 border border-white/5 rounded-3xl flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 flex-shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-white font-bold text-xs">Aviso técnico</h5>
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                      La generación de video toma de 2 a 5 minutos. Te avisaremos cuando esté listo. Puedes cerrar esta ventana y volver más tarde.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || prompt.length < 10}
                className={`w-full py-5 rounded-[25px] font-bold shadow-2xl transition-all flex items-center justify-center gap-3 transform active:scale-[0.98]
                  ${isGenerating || prompt.length < 10 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-primaryhover text-white shadow-primary/30'}
                `}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Iniciando Proyecto...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-6 h-6" />
                    <span>Lanzar Producción</span>
                  </>
                )}
              </button>
              <div className="mt-5 flex items-center justify-center gap-6 text-[10px] text-gray-600">
                <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Motor Runway Gen-3</span>
                <span className="flex items-center gap-1.5 font-bold text-orange-400"><RefreshCw className="w-3.5 h-3.5" /> 5 Créditos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
