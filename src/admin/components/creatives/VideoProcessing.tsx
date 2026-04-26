import { useState, useEffect } from 'react';
import {
  Video, Loader2, Download, Save,
  CheckCircle2, AlertCircle, Clock, ArrowRight,
  TrendingUp, RefreshCw,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type VideoStatus = 'processing' | 'completed' | 'failed';

interface Props {
  videoId: string;
  onBack: () => void;
}

export default function VideoProcessing({ videoId, onBack }: Props) {
  const [status, setStatus] = useState<VideoStatus>('processing');
  const [progress, setProgress] = useState(10);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-video-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ videoId }),
        });

        const data = await response.json();
        if (!data.ok) throw new Error(data.error);

        setStatus(data.status as VideoStatus);
        setProgress(data.progress);

        if (data.status === 'completed' && data.videoUrl) {
          setVideoUrl(data.videoUrl as string);
        } else if (data.status === 'failed') {
          setError('La generación de video falló. Por favor intenta de nuevo.');
        }
      } catch (err) {
        console.error('Error checking video status:', err);
      }
    };

    let intervalId: ReturnType<typeof setInterval> | undefined;

    if (status === 'processing') {
      intervalId = setInterval(checkStatus, 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status, videoId]);

  const handleSave = async () => {
    if (!videoUrl || saved) return;

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
          creative_id: videoId,
          creative_type: 'video',
          name: 'Video Generado con IA',
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
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto py-12">
      <div className="bg-cardbg border border-white/5 rounded-[40px] p-10 md:p-16 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.02] to-transparent pointer-events-none"></div>

        {status === 'processing' ? (
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-12">
              <div className="w-32 h-32 rounded-full border-4 border-white/5 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" style={{ animationDuration: '3s' }}></div>
                <Video className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-orange-500 text-white rounded-2xl px-4 py-2 text-xs font-bold shadow-lg shadow-primary/20">
                {progress}%
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">Estamos produciendo tu video</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed mb-10">
              FAL.ai está renderizando cada fotograma. Esto suele tardar entre 1 y 5 minutos. No es necesario que te quedes en esta pantalla.
            </p>

            <div className="w-full max-w-md bg-white/5 h-2 rounded-full overflow-hidden mb-12">
              <div
                className="h-full bg-primary transition-all duration-1000 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl text-left flex items-center gap-4 group hover:bg-white/[0.04] transition-all cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Estado actual</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Renderizando texturas y luz...</p>
                </div>
              </div>

              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl text-left flex items-center gap-4 group hover:bg-white/[0.04] transition-all cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Tiempo restante</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Aprox. 2 min 30 s</p>
                </div>
              </div>
            </div>

            <button
              onClick={onBack}
              className="mt-12 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-all group"
            >
              Puedes volver a Creativos y regresar luego <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : status === 'completed' ? (
          <div className="flex flex-col items-center">
            <div className="w-full aspect-video bg-background rounded-3xl overflow-hidden border border-white/10 mb-10 shadow-3xl group relative">
              <video
                src={videoUrl ?? undefined}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-lg">
              <a
                href={videoUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                download
                className="w-full flex-1 py-4 bg-primary hover:bg-primaryhover text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-xl shadow-primary/20"
              >
                <Download className="w-5 h-5" /> Descargar Video
              </a>
              <button
                onClick={handleSave}
                disabled={isSaving || saved}
                className={`w-full flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border transform active:scale-[0.98]
                  ${saved
                    ? 'bg-green-500/10 border-green-500/20 text-green-400 cursor-default'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 shadow-lg'}
                `}
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {saved ? 'Guardado en Biblioteca' : 'Guardar en Biblioteca'}
              </button>
            </div>

            <button
              onClick={onBack}
              className="mt-12 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Crear un nuevo video
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-10">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mb-6">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">UPSS... Algo salió mal</h2>
            <p className="text-gray-500 text-sm max-w-sm mb-10 leading-relaxed">
              Hubo un error al procesar tu video. No te preocupes, tus créditos no se descontarán.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setStatus('processing')}
                className="py-3 px-8 bg-primary hover:bg-primaryhover text-white rounded-xl font-bold transition-all transform active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Reintentar
              </button>
              <button
                onClick={onBack}
                className="py-3 px-8 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all shadow-lg"
              >
                Volver a Creativos
              </button>
            </div>
            {error && <p className="mt-8 text-[10px] text-red-400 font-mono italic">Error: {error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
