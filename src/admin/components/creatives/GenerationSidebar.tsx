import { useState, useEffect } from 'react';
import { X, Sparkles, Upload, ChevronRight, ChevronDown, Zap, Loader2, Download } from 'lucide-react';
import { IMAGE_MODELS, VIDEO_MODELS } from '../../data/modelsData';
import type { CreativePreset } from '../../data/modelsData';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../contexts/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preset: CreativePreset | Record<string, unknown> | null;
  mediaType: string;
  onOpenModelSelector: () => void;
  selectedModelId: string;
}

type Result =
  | { kind: 'image'; url: string }
  | { kind: 'video'; videoId: string; url?: string; status: 'processing' | 'completed' | 'failed' };

export default function GenerationSidebar({ isOpen, onClose, preset, mediaType, onOpenModelSelector, selectedModelId }: Props) {
  const toast = useToast();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [variations, setVariations] = useState(1);
  const [duration, setDuration] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isImproving, setIsImproving] = useState(false);

  const isVideo = mediaType === 'video' || mediaType === 'img2vid';
  const allModels = isVideo ? VIDEO_MODELS : IMAGE_MODELS;
  const currentModel = allModels.find(m => m.id === selectedModelId) || allModels[0];

  useEffect(() => {
    if (preset) {
      setPrompt((preset as Record<string, unknown>).imageDesc as string || '');
      setResult(null);
      setImageLoadError(false);
    }
  }, [preset]);

  // Polling para video cuando el status es 'processing'
  useEffect(() => {
    if (!result || result.kind !== 'video' || result.status !== 'processing') return;
    const intervalId = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-video-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ videoId: result.videoId }),
        });
        const data = await r.json();
        if (data.status === 'completed' && data.videoUrl) {
          setResult({ kind: 'video', videoId: result.videoId, url: data.videoUrl, status: 'completed' });
        } else if (data.status === 'failed') {
          setResult({ kind: 'video', videoId: result.videoId, status: 'failed' });
          toast.error('La generación de video falló.');
        }
      } catch (err) { console.error(err); }
    }, 8000);
    return () => clearInterval(intervalId);
  }, [result, toast]);

  const handleImprovePrompt = async () => {
    if (prompt.trim().length < 5) {
      toast.error('Escribe al menos una idea breve antes de mejorar el prompt.');
      return;
    }
    try {
      setIsImproving(true);
      const { data: { session } } = await supabase.auth.getSession();
      const targetType = isVideo ? 'video' : 'imagen';
      const systemPrompt = `Eres un experto en prompt engineering para modelos de generación de ${targetType} (FAL.ai, Flux, Imagen, Seedream, Kling, etc.).
Tu tarea es reescribir el prompt del usuario para que produzca un mejor resultado visual.

Reglas:
- Devuelve SOLO el prompt mejorado, sin explicaciones, sin comillas, sin viñetas.
- Mantén el idioma del usuario (español si está en español, inglés si está en inglés).
- Conserva los elementos clave que el usuario menciona (producto, marca, color, escena).
- Añade detalles técnicos: iluminación, ángulo de cámara, estilo, calidad ("ultra detailed", "professional studio lighting", "8k", "shallow depth of field" cuando aplique).
- Máximo 80 palabras.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);
      let r: Response;
      try {
        r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-guion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ systemPrompt, userPrompt: prompt }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
      const data = await r.json();
      if (!r.ok || !data.result) {
        throw new Error(data.error || 'No se pudo mejorar el prompt');
      }
      setPrompt(data.result.trim());
      toast.success('Prompt mejorado con IA');
    } catch (err) {
      toast.error('Error al mejorar: ' + (err as Error).message);
    } finally {
      setIsImproving(false);
    }
  };

  const handleGenerate = async () => {
    if (prompt.trim().length < 10) {
      toast.error('El prompt debe tener al menos 10 caracteres.');
      return;
    }
    const controller = new AbortController();
    // Imagen: 60s. Video: 20s (sólo encolamos, el polling después es rápido).
    const fetchTimeoutMs = isVideo ? 20_000 : 60_000;
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeoutMs);

    try {
      setIsGenerating(true);
      setResult(null);
      setImageLoadError(false);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
      }
      const endpoint = isVideo ? 'generate-video' : 'generate-image';
      const body = isVideo
        ? { prompt, modelId: selectedModelId, duration, aspectRatio }
        : { prompt, modelId: selectedModelId, aspectRatio, numImages: variations };

      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      let data: { ok?: boolean; error?: string; details?: unknown; image?: { url: string }; video?: { id: string } };
      try {
        data = await r.json();
      } catch {
        throw new Error(`El servidor devolvió una respuesta no válida (HTTP ${r.status})`);
      }

      if (!r.ok || !data.ok) {
        const detail = data.error || `HTTP ${r.status}`;
        console.error('Generate error:', { status: r.status, body: data });
        throw new Error(detail);
      }

      if (isVideo) {
        if (!data.video?.id) throw new Error('Respuesta sin video.id');
        setResult({ kind: 'video', videoId: data.video.id, status: 'processing' });
      } else {
        if (!data.image?.url) throw new Error('Respuesta sin image.url');
        setResult({ kind: 'image', url: data.image.url });
      }
    } catch (err) {
      const e = err as Error;
      const msg = e.name === 'AbortError'
        ? `La generación tardó más de ${fetchTimeoutMs / 1000}s. Intenta con un modelo más rápido.`
        : e.message;
      toast.error('Error al generar: ' + msg);
    } finally {
      clearTimeout(timeoutId);
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-[450px] bg-[#0a131f] border-l border-white/5 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              PRESET · {(preset as Record<string, unknown>)?.category as string || 'CUSTOM'}
            </p>
            <h2 className="text-xl font-bold text-white">{(preset as Record<string, unknown>)?.name as string || 'Nueva Generación'}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">

          {/* Tu Prompt */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-white">Tu prompt</label>
              <button
                onClick={handleImprovePrompt}
                disabled={isImproving || prompt.trim().length < 5}
                className={`flex items-center gap-1.5 text-[11px] font-bold transition-colors ${
                  isImproving || prompt.trim().length < 5
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-primary hover:text-primaryhover'
                }`}
              >
                {isImproving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mejorando...</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" /> Mejorar con IA</>
                )}
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 bg-background border border-white/10 rounded-xl p-4 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-primary/50 resize-none transition-colors"
              placeholder="Describe lo que quieres generar..."
            />
          </div>

          {/* Referencias */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">
              Referencias <span className="text-xs font-normal text-gray-500">(opcional - hasta 4)</span>
            </label>
            <button className="w-full py-8 border border-white/10 border-dashed rounded-xl bg-background hover:bg-white/[0.02] transition-colors flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-gray-400 hover:border-white/20">
              <Upload className="w-5 h-5" />
              <span className="text-[11px]">Arrastra imágenes o haz clic para subir</span>
            </button>
          </div>

          {/* Modelo de IA */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-3">
              🤖 Modelo de IA
            </label>
            <button
              onClick={onOpenModelSelector}
              className="w-full p-4 border border-white/10 rounded-xl bg-background hover:border-white/20 hover:bg-white/[0.02] transition-all flex items-center gap-4 text-left"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs"
                style={{ backgroundColor: `${currentModel.tagColor}15`, color: currentModel.tagColor }}
              >
                {currentModel.sigla}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{currentModel.name}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${currentModel.tagColor}20`, color: currentModel.tagColor }}
                  >
                    {currentModel.tagIcon && <span className="mr-0.5">{currentModel.tagIcon}</span>}
                    {currentModel.tag}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1.5">
                  <span>{currentModel.company}</span>
                  <span>·</span>
                  <span className="font-bold text-gray-300">{currentModel.generationCost}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Configuración */}
          <div>
            <label className="block text-sm font-bold text-white mb-4">Configuración</label>

            {/* Aspect Ratio */}
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-2">Aspect ratio</label>
              <div className="flex gap-2">
                {['1:1', '9:16', '16:9', '4:5', '3:4'].map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      aspectRatio === ratio
                        ? 'bg-transparent border border-primary text-primary'
                        : 'bg-transparent border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Variaciones */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500">Variaciones</label>
                <span className="text-xs font-bold text-white">{variations}</span>
              </div>
              <input
                type="range"
                min="1" max="4"
                value={variations}
                onChange={(e) => setVariations(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            {/* Duración (Solo Video) */}
            {(mediaType === 'video' || mediaType === 'img2vid') && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-500">Duración</label>
                  <span className="text-xs font-bold text-white">{duration}s</span>
                </div>
                <input
                  type="range"
                  min="5" max="30" step="1"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full h-1 bg-primary/20 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #f97316 ${((duration - 5) / 25) * 100}%, rgba(255,255,255,0.1) ${((duration - 5) / 25) * 100}%)`,
                  }}
                />
              </div>
            )}

            {/* Resolución */}
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-2">Resolución</label>
              <button className="px-4 py-1.5 rounded-lg border border-primary text-primary text-xs font-bold">
                1080p
              </button>
            </div>

            {/* Avanzado */}
            <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
              <ChevronDown className="w-3.5 h-3.5" /> Avanzado
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-[#0a131f]">
          <div className="flex items-end justify-between mb-4">
            <span className="text-[10px] font-bold text-gray-500">
              {currentModel.sigla} · {mediaType === 'imagen' ? 'HQ' : `${duration}s`} · HD
            </span>
            <span className="text-sm font-bold text-white flex gap-1">
              {currentModel.generationCost.split('·')[0].trim()} <span className="text-primary font-normal text-sm">· {currentModel.generationCost.split('·')[1]?.trim()}</span>
            </span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || prompt.trim().length < 10}
            className={`w-full py-4 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 transform active:scale-[0.98] ${
              isGenerating || prompt.trim().length < 10
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-primary hover:bg-primaryhover text-white shadow-primary/20'
            }`}
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
            ) : (
              <><Zap className="w-4 h-4" /> Generar</>
            )}
          </button>

          {result && (
            <div className="mt-4">
              {result.kind === 'image' && (
                <>
                  {imageLoadError ? (
                    <div className="w-full rounded-lg mb-2 p-4 bg-amber-500/5 border border-amber-500/20 text-center">
                      <p className="text-xs text-amber-300 mb-2">
                        La imagen se generó pero el navegador no pudo mostrarla aquí.
                      </p>
                      <a href={result.url} target="_blank" rel="noreferrer"
                        className="text-xs text-primary underline break-all">
                        Abrir imagen en nueva pestaña
                      </a>
                    </div>
                  ) : (
                    <img
                      src={result.url}
                      alt="Resultado"
                      className="w-full rounded-lg mb-2"
                      onError={() => {
                        console.error('Image failed to load:', result.url);
                        setImageLoadError(true);
                      }}
                    />
                  )}
                  <a href={result.url} target="_blank" rel="noreferrer" download
                    className="flex items-center justify-center gap-2 w-full py-2 text-xs font-bold text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    <Download className="w-3.5 h-3.5" /> Descargar
                  </a>
                </>
              )}
              {result.kind === 'video' && result.status === 'processing' && (
                <p className="text-xs text-gray-400 text-center py-3 flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Renderizando video... (1-5 min)
                </p>
              )}
              {result.kind === 'video' && result.status === 'completed' && result.url && (
                <>
                  <video src={result.url} controls autoPlay className="w-full rounded-lg mb-2" />
                  <a href={result.url} target="_blank" rel="noreferrer" download
                    className="flex items-center justify-center gap-2 w-full py-2 text-xs font-bold text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    <Download className="w-3.5 h-3.5" /> Descargar
                  </a>
                </>
              )}
              {result.kind === 'video' && result.status === 'failed' && (
                <p className="text-xs text-red-400 text-center py-3">La generación falló. Inténtalo de nuevo.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
