import { useState } from 'react';
import {
  Sparkles, Maximize, Smartphone,
  Monitor, Wand2, Loader2, Download, Save,
  CheckCircle2, RefreshCw, ChevronLeft,
  Image as ImageIcon,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../contexts/ToastContext';

interface ImageResult {
  id: string;
  url: string;
  prompt: string;
}

interface Props {
  onBack: () => void;
  initialPrompt?: string;
  modelId?: string;
}

// Mapa interno: "1024x1024" → "1:1" (compat con la UI antigua de dimensiones)
const dimensionToAspect: Record<string, string> = {
  '1024x1024': '1:1',
  '1792x1024': '16:9',
  '1024x1792': '9:16',
};

export default function GenerarImageModal({ onBack, initialPrompt = '', modelId = 'flux-schnell' }: Props) {
  const toast = useToast();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [dimensions, setDimensions] = useState('1024x1024');
  const [quality, setQuality] = useState('hd');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ImageResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    if (!prompt || prompt.length < 10) return;

    try {
      setIsGenerating(true);
      setResult(null);
      setSaved(false);

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prompt,
          modelId,
          aspectRatio: dimensionToAspect[dimensions] ?? '1:1',
        }),
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error as string);

      setResult(data.image as ImageResult);
    } catch (err) {
      console.error('Error generating image:', err);
      toast.error('Error al generar la imagen: ' + (err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!result || saved) return;

    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-creative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          creative_id: result.id,
          creative_type: 'image',
          name: result.prompt.substring(0, 50),
        }),
      });

      if (response.ok) {
        setSaved(true);
      }
    } catch (err) {
      console.error('Error saving creative:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-400">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-primary mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Volver a Creativos
      </button>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1">
          <div className="bg-cardbg border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 relative">
              <Sparkles className="w-6 h-6 text-primary" /> Generador de Imágenes IA
            </h2>

            <div className="space-y-8 relative">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Concepto o Descripción</label>
                  <span className="text-[10px] text-gray-600 font-mono">{prompt.length}/1000</span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej: Un banner publicitario para una marca de zapatillas deportivas, estilo cinematográfico, luz de neón, ultra-realista 4k..."
                  className="w-full bg-background border border-white/5 rounded-2xl p-5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-primary/40 min-h-[140px] transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Calidad del Modelo</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: 'Standard', v: 'standard', d: 'Rápido y eficiente' },
                      { l: 'Alta Definición', v: 'hd', d: 'Máximo detalle' },
                    ].map(q => (
                      <button
                        key={q.v}
                        onClick={() => setQuality(q.v)}
                        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                          quality === q.v ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-white/5 text-gray-500 hover:border-white/10'
                        }`}
                      >
                        <p className="font-bold text-xs">{q.l}</p>
                        <p className="text-[10px] mt-0.5 opacity-60 font-medium">{q.d}</p>
                        {quality === q.v && <CheckCircle2 className="absolute top-2 right-2 w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Formato / Red Social</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { l: 'Cuadrado', v: '1024x1024', i: Maximize, s: '1:1' },
                      { l: 'Vertical', v: '1024x1792', i: Smartphone, s: '9:16' },
                      { l: 'Panorámico', v: '1792x1024', i: Monitor, s: '16:9' },
                    ].map(a => (
                      <button
                        key={a.v}
                        onClick={() => setDimensions(a.v)}
                        disabled={a.v === '1024x1792'}
                        className={`group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${
                          dimensions === a.v ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-white/5 text-gray-500 hover:border-white/10'
                        } ${a.v === '1024x1792' ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <a.i className={`w-5 h-5 transition-transform ${dimensions === a.v ? 'scale-110' : ''}`} />
                        <div className="text-center">
                          <p className="text-[10px] font-bold block">{a.s}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || prompt.length < 10}
                  className={`w-full py-5 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-3 transform active:scale-[0.98]
                    ${isGenerating || prompt.length < 10 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-primaryhover text-white shadow-primary/20'}
                  `}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generando tu visión...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      <span>Generar Imagen</span>
                    </>
                  )}
                </button>
                <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-gray-600">
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Modelo: {modelId}</span>
                  <span className="flex items-center gap-1 font-bold text-primary"><RefreshCw className="w-3 h-3" /> 1 Crédito por generación</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[450px]">
          <div className="bg-cardbg border border-white/5 rounded-3xl h-full flex flex-col p-2 min-h-[400px]">
            {result ? (
              <div className="flex-1 flex flex-col p-2 space-y-4">
                <div className="flex-1 rounded-2xl overflow-hidden bg-background relative group">
                  <img src={result.url} alt="IA Result" loading="lazy" className="w-full h-full object-contain" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-black/60 backdrop-blur-md text-white rounded-xl hover:bg-primary transition-all border border-white/10"
                      title="Descargar"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-background/50 rounded-2xl border border-white/5">
                  <h4 className="text-white font-bold text-sm mb-4">Acciones rápidas</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={isSaving || saved}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border
                        ${saved
                          ? 'bg-green-500/10 border-green-500/20 text-green-400 cursor-default'
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10 shadow-lg'}
                      `}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      {saved ? 'Guardado' : 'Guardar en mi Biblioteca'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className={`w-24 h-24 rounded-[30px] border border-dashed border-white/10 flex items-center justify-center mb-6
                  ${isGenerating ? 'animate-pulse bg-primary/5 border-primary/20 scale-110' : 'bg-white/5'} transition-all`}
                >
                  <ImageIcon className={`w-10 h-10 ${isGenerating ? 'text-primary' : 'text-gray-800'}`} />
                </div>
                <h4 className="text-white font-bold mb-2">
                  {isGenerating ? 'Traduciendo tus palabras a píxeles...' : 'Vista Previa del Resultado'}
                </h4>
                <p className="text-xs text-gray-500 max-w-[280px] leading-relaxed">
                  {isGenerating
                    ? 'Estamos usando FAL.ai para crear una imagen única. Esto suele tomar de 5 a 30 segundos.'
                    : 'Ingresa una descripción detallada en el panel de la izquierda y presiona "Generar Imagen" para ver la magia.'}
                </p>
                {isGenerating && (
                  <div className="mt-8 w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-progress-indefinite rounded-full"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
